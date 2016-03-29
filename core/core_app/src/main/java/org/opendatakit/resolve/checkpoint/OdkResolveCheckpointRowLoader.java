/*
 * Copyright (C) 2015 University of Washington
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package org.opendatakit.resolve.checkpoint;

import android.content.AsyncTaskLoader;
import android.content.Context;
import android.database.Cursor;
import org.opendatakit.aggregate.odktables.rest.KeyValueStoreConstants;
import org.opendatakit.common.android.data.OrderedColumns;
import org.opendatakit.common.android.data.Row;
import org.opendatakit.common.android.data.UserTable;
import org.opendatakit.common.android.database.DatabaseConstants;
import org.opendatakit.common.android.database.OdkConnectionFactorySingleton;
import org.opendatakit.common.android.database.OdkConnectionInterface;
import org.opendatakit.common.android.provider.DataTableColumns;
import org.opendatakit.common.android.provider.FormsColumns;
import org.opendatakit.common.android.utilities.NameUtil;
import org.opendatakit.common.android.utilities.ODKDataUtils;
import org.opendatakit.common.android.utilities.ODKDatabaseImplUtils;
import org.opendatakit.common.android.utilities.WebLogger;
import org.opendatakit.database.service.KeyValueStoreEntry;
import org.opendatakit.database.service.OdkDbHandle;
import org.opendatakit.resolve.views.components.ResolveActionList;
import org.opendatakit.resolve.views.components.ResolveRowEntry;

import java.util.ArrayList;
import java.util.UUID;

/**
 * @author mitchellsundt@gmail.com
 */
public class OdkResolveCheckpointRowLoader extends AsyncTaskLoader<ArrayList<ResolveRowEntry>> {

  private final String mAppName;
  private final String mTableId;
  private final boolean mHaveResolvedMetadataConflicts;

  private static class FormDefinition {
    String instanceName;
    String formDisplayName;
    String formId;
  }

  public OdkResolveCheckpointRowLoader(Context context, String appName, String tableId,
      boolean haveResolvedMetadataConflicts) {
    super(context);
    this.mAppName = appName;
    this.mTableId = tableId;
    this.mHaveResolvedMetadataConflicts = haveResolvedMetadataConflicts;
  }

  @Override public ArrayList<ResolveRowEntry> loadInBackground() {

    OdkConnectionInterface db = null;

    OdkDbHandle dbHandleName = new OdkDbHandle(UUID.randomUUID().toString());

    ArrayList<FormDefinition> formDefinitions = new ArrayList<FormDefinition>();
    String tableDisplayName = null;
    Cursor forms = null;
    UserTable table = null;

    try {
      // +1 referenceCount if db is returned (non-null)
      db = OdkConnectionFactorySingleton.getOdkConnectionFactoryInterface()
          .getConnection(mAppName, dbHandleName);

      OrderedColumns orderedDefns = ODKDatabaseImplUtils.get().getUserDefinedColumns(db,
          mAppName, mTableId);
      String[] empty = {};
      String[] groupBy = { DataTableColumns.ID };
      table = ODKDatabaseImplUtils.get().rawSqlQuery(db, mAppName, mTableId, orderedDefns,
          DataTableColumns.SAVEPOINT_TYPE + " IS NULL", empty, groupBy, null,
          DataTableColumns.SAVEPOINT_TIMESTAMP, "DESC");

      if ( !mHaveResolvedMetadataConflicts ) {

        boolean tableSetChanged = false;
        // resolve the automatically-resolvable ones
        // (the ones that differ only in their metadata).
        for (int i = 0; i < table.getNumberOfRows(); ++i) {
          Row row = table.getRowAtIndex(i);
          String rowId = row.getRawDataOrMetadataByElementKey(DataTableColumns.ID);

          OdkResolveCheckpointFieldLoader loader = new OdkResolveCheckpointFieldLoader(getContext(),
              mAppName, mTableId, rowId);
          ResolveActionList resolveActionList = loader.doWork(dbHandleName);

          if (resolveActionList.noChangesInUserDefinedFieldValues()) {
            tableSetChanged = true;
            ODKDatabaseImplUtils.get().deleteAllCheckpointRowsWithId(db, mAppName, mTableId, rowId);
          }
        }

        if ( tableSetChanged ) {
          table = ODKDatabaseImplUtils.get().rawSqlQuery(db, mAppName, mTableId, orderedDefns,
              DataTableColumns.SAVEPOINT_TYPE + " IS NULL", empty, groupBy, null,
              DataTableColumns.SAVEPOINT_TIMESTAMP, "DESC");
        }
      }

      // The display name is the table display name, not the form display name...
      ArrayList<KeyValueStoreEntry> entries = ODKDatabaseImplUtils.get().getDBTableMetadata(db,
          mTableId, KeyValueStoreConstants.PARTITION_TABLE, KeyValueStoreConstants.ASPECT_DEFAULT,
          KeyValueStoreConstants.TABLE_DISPLAY_NAME);

      tableDisplayName = entries.isEmpty() ?  NameUtil.normalizeDisplayName(NameUtil
          .constructSimpleDisplayName(mTableId)) : entries.get(0).value;

      forms = ODKDatabaseImplUtils.get().rawQuery(db,
          "SELECT " + FormsColumns.INSTANCE_NAME +
              " , " + FormsColumns.FORM_ID +
              " , " + FormsColumns.DISPLAY_NAME +
              " FROM " + DatabaseConstants.FORMS_TABLE_NAME +
              " WHERE " + FormsColumns.TABLE_ID + "=?" +
              " ORDER BY " + FormsColumns.FORM_ID + " ASC",
          new String[]{ mTableId });

      if ( forms != null && forms.moveToFirst() ) {
        int idxInstanceName = forms.getColumnIndex(FormsColumns.INSTANCE_NAME);
        int idxFormId = forms.getColumnIndex(FormsColumns.FORM_ID);
        int idxFormDisplayName = forms.getColumnIndex(FormsColumns.DISPLAY_NAME);
        do {
          if ( forms.isNull(idxInstanceName) ) {
            continue;
          }

          String instanceName = forms.getString(idxInstanceName);
          if ( instanceName == null || instanceName.length() == 0 ) {
            continue;
          }

          String formId = forms.getString(idxFormId);
          String formDisplayName = forms.getString(idxFormDisplayName);

          FormDefinition fd = new FormDefinition();
          fd.instanceName = instanceName;
          fd.formDisplayName = formDisplayName;
          fd.formId = formId;
          formDefinitions.add(fd);
        } while (forms.moveToNext());
      }
      if ( forms != null ) {
        forms.close();
      }
    } catch (Exception e) {
      String msg = e.getLocalizedMessage();
      if (msg == null)
        msg = e.getMessage();
      if (msg == null)
        msg = e.toString();
      msg = "Exception: " + msg;
      WebLogger.getLogger(mAppName).e("OdkResolveCheckpointRowLoader",
          mAppName + " " + dbHandleName.getDatabaseHandle() + " " + msg);
      WebLogger.getLogger(mAppName).printStackTrace(e);
      throw new IllegalStateException(msg);
    } finally {
      if ( forms != null ) {
        if ( !forms.isClosed() ) {
          forms.close();
        }
        forms = null;
      }
      if (db != null) {
        // release the reference...
        // this does not necessarily close the db handle
        // or terminate any pending transaction
        db.releaseReference();
      }
    }

    // use the instanceName in the tableId form, if defined.
    FormDefinition nameToUse = null;
    for ( FormDefinition fd : formDefinitions ) {
      if ( fd.formId.equals(mTableId) ) {
        nameToUse = fd;
        break;
      }
    }
    if ( nameToUse == null ) {
      if ( formDefinitions.isEmpty() ) {
        nameToUse = new FormDefinition();
        nameToUse.formId = null;
        nameToUse.formDisplayName = tableDisplayName;
        nameToUse.instanceName = DataTableColumns.SAVEPOINT_TIMESTAMP;
      } else {
        // otherwise use the name from the first formId that gave one.
        nameToUse = formDefinitions.get(0);
      }
    }
    String formDisplayName = ODKDataUtils.getLocalizedDisplayName(nameToUse.formDisplayName);

    ArrayList<ResolveRowEntry> results = new ArrayList<ResolveRowEntry>();
    for (int i = 0; i < table.getNumberOfRows(); i++) {
      Row row = table.getRowAtIndex(i);
      String rowId = row.getRawDataOrMetadataByElementKey(DataTableColumns.ID);
      String instanceName = row.getRawDataOrMetadataByElementKey(nameToUse.instanceName);
      ResolveRowEntry re = new ResolveRowEntry(rowId, formDisplayName + ": " + instanceName);
      results.add(re);
    }
    return results;
  }

  @Override protected void onStartLoading() {
    super.onStartLoading();
    forceLoad();
  }
}
