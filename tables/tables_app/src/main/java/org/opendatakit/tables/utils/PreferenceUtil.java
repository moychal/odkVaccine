/*
 * Copyright (C) 2012-2014 University of Washington
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
package org.opendatakit.tables.utils;

import org.opendatakit.aggregate.odktables.rest.ElementDataType;
import org.opendatakit.common.android.data.TableViewType;
import org.opendatakit.common.android.utilities.*;
import org.opendatakit.database.service.KeyValueStoreEntry;
import org.opendatakit.database.service.OdkDbHandle;
import org.opendatakit.tables.application.Tables;
import org.opendatakit.tables.views.SpreadsheetView;

import android.content.Context;
import android.os.RemoteException;
import android.widget.Toast;

import java.util.List;

/**
 * 
 * @author sudar.sam@gmail.com
 *
 */
public class PreferenceUtil {
  
  private static final String TAG = PreferenceUtil.class.getSimpleName();
    
  /**
   * Save viewType to be the default view type for the tableId
   * 
   * @param context
   * @param appName
   * @param tableId
   * @param viewType
   */
  public static void setDefaultViewType(
      Context context,
      String appName,
      String tableId,
      TableViewType viewType) {

    try {
      TableUtil.get().atomicSetDefaultViewType(Tables.getInstance(), appName, tableId, viewType);
    } catch (RemoteException e) {
      Toast.makeText(context, "Unable to change default view type", Toast.LENGTH_LONG).show();
    }
  }
  
  /**
   * Get the width thast has been set for the column. If none has been set,
   * returns {@see DEFAULT_COL_WIDTH}.
   *
   * @param context
   * @param appName
   * @param tableId
   * @param elementKey
   * @return
   * @throws RemoteException
   */
  public static int getColumnWidth(
      Context context, String appName, String tableId,
      String elementKey) throws RemoteException {
    Integer result = null;
    OdkDbHandle db = null;
    try {
      db = Tables.getInstance().getDatabase().openDatabase(appName);
      result = ColumnUtil.get().getColumnWidth(Tables.getInstance(), appName, db, tableId, elementKey);
    } finally {
      if ( db != null ) {
        Tables.getInstance().getDatabase().closeDatabase(appName, db);
      }
    }
    return result;
  }
  
  public static void setColumnWidth(
      Context context,
      String appName,
      String tableId,
      String elementKey,
      int newColumnWidth) {

    try {
      ColumnUtil.get().atomicSetColumnWidth(Tables.getInstance(), appName, tableId, elementKey, newColumnWidth);
    } catch ( RemoteException e ) {
      Toast.makeText(context, "Unable to change Column Width", Toast.LENGTH_LONG).show();
    }
  }

}
