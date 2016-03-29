/*
 * Copyright (C) 2014 University of Washington
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
package org.opendatakit.tables.fragments;

import java.io.File;

import org.opendatakit.aggregate.odktables.rest.ElementDataType;
import org.opendatakit.aggregate.odktables.rest.KeyValueStoreConstants;
import org.opendatakit.common.android.data.ColorRuleGroup;
import org.opendatakit.common.android.data.TableViewType;
import org.opendatakit.common.android.utilities.*;
import org.opendatakit.database.service.KeyValueStoreEntry;
import org.opendatakit.database.service.OdkDbHandle;
import org.opendatakit.database.service.OdkDbInterface;
import org.opendatakit.tables.R;
import org.opendatakit.tables.activities.AbsBaseActivity;
import org.opendatakit.tables.activities.TableLevelPreferencesActivity;
import org.opendatakit.tables.application.Tables;
import org.opendatakit.tables.preferences.DefaultViewTypePreference;
import org.opendatakit.tables.preferences.EditFormDialogPreference;
import org.opendatakit.tables.preferences.FileSelectorPreference;
import org.opendatakit.tables.utils.Constants;
import org.opendatakit.tables.utils.PreferenceUtil;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.RemoteException;
import android.preference.EditTextPreference;
import android.preference.ListPreference;
import android.preference.Preference;
import android.preference.Preference.OnPreferenceChangeListener;
import android.preference.Preference.OnPreferenceClickListener;
import android.view.ContextMenu;
import android.widget.Toast;

/**
 * Displays preferences and information surrounding a table.
 * 
 * @author sudar.sam@gmail.com
 *
 */
public class TablePreferenceFragment extends AbsTableLevelPreferenceFragment {

  private static final String TAG = TablePreferenceFragment.class.getSimpleName();

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // AppName may not be available...
    // Let's load preferences from the resource.
    this.addPreferencesFromResource(R.xml.table_preference);
  }

  @Override
  public void onActivityCreated(Bundle savedInstanceState) {
    super.onActivityCreated(savedInstanceState);
  }

  @Override
  public void onResume() {
    super.onResume();
    // Verify that we're attaching to the right activity.
    // Now we have to do the various initialization required for the different
    // preferences.
    try {
      this.initializeAllPreferences();
    } catch (RemoteException e) {
      WebLogger.getLogger(getAppName()).printStackTrace(e);
      Toast.makeText(getActivity(), "Unable to access database", Toast.LENGTH_LONG).show();
    }
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    String fullPath = null;
    String relativePath = null;
    WebLogger.getLogger(getAppName()).d(TAG, "[onActivityResult]");
    try {
      switch (requestCode) {
      case Constants.RequestCodes.CHOOSE_LIST_FILE:
        if ( data != null ) {
          fullPath = getFullPathFromIntent(data);
          relativePath = getRelativePathOfFile(fullPath);
          this.setListViewFileName(relativePath);
        }
        break;
      case Constants.RequestCodes.CHOOSE_DETAIL_FILE:
        if ( data != null ) {
          fullPath = getFullPathFromIntent(data);
          relativePath = getRelativePathOfFile(fullPath);
          this.setDetailViewFileName(relativePath);
        }
        break;
      case Constants.RequestCodes.CHOOSE_MAP_FILE:
        if ( data != null ) {
          fullPath = getFullPathFromIntent(data);
          relativePath = getRelativePathOfFile(fullPath);
          this.setMapListViewFileName(relativePath);
        }
        break;
      default:
        super.onActivityResult(requestCode, resultCode, data);
      }
    } catch ( RemoteException e ) {
      WebLogger.getLogger(getAppName()).printStackTrace(e);
      Toast.makeText(getActivity(), "Unable to access database", Toast.LENGTH_LONG).show();
    }
  }

  /**
   * Return the full path of the file selected from the intent.
   * 
   * @param intent
   * @return
   */
  private String getFullPathFromIntent(Intent intent) {
    Uri uri = intent.getData();
    String fullPath = uri.getPath();
    return fullPath;
  }

  /**
   * Sets the file name for the list view of this table.
   * 
   * @param relativePath
   * @throws RemoteException 
   */
  void setListViewFileName(String relativePath) throws RemoteException {
    try {
      TableUtil.get().atomicSetListViewFilename(Tables.getInstance(), getAppName(), getTableId(), relativePath);
    } catch ( RemoteException e) {
      Toast.makeText(getActivity(), "Unable to save List View filename", Toast.LENGTH_LONG).show();
    }
  }

  /**
   * Sets the file name for the detail view of this table.
   * 
   * @param relativePath
   * @throws RemoteException 
   */
  void setDetailViewFileName(String relativePath) throws RemoteException {
    try {
      TableUtil.get().atomicSetDetailViewFilename(Tables.getInstance(), getAppName(), getTableId(), relativePath);
    } catch ( RemoteException e ) {
      Toast.makeText(getActivity(), "Unable to set Detail View filename", Toast.LENGTH_LONG).show();
    }
  }

  /**
   * Sets the file name for the list view to be displayed in the map.
   * 
   * @param relativePath
   * @throws RemoteException 
   */
  void setMapListViewFileName(String relativePath) throws RemoteException {
    try {
      TableUtil.get().atomicSetMapListViewFilename(Tables.getInstance(), getAppName(), getTableId(), relativePath);
    } catch (RemoteException e) {
      Toast.makeText(getActivity(), "Unable to set Map List View Filename", Toast.LENGTH_LONG).show();
    }
  }

  /**
   * Convenience method for initializing all the preferences. Requires a
   * {@link ContextMenu}, so must be called in or after
   * {@link TablePreferenceFragment#onActivityCreated(Bundle)}.
   * @throws RemoteException 
   */
  protected void initializeAllPreferences() throws RemoteException {
    OdkDbHandle db = null;
    try {
      db = Tables.getInstance().getDatabase().openDatabase(getAppName());

      this.initializeDisplayNamePreference(db);
      this.initializeTableIdPreference();
      this.initializeDefaultForm();
      this.initializeDefaultViewType();
      this.initializeTableColorRules();
      this.initializeStatusColorRules();
      this.initializeMapColorRule();
      this.initializeDetailFile(db);
      this.initializeListFile(db);
      this.initializeMapListFile(db);
      this.initializeColumns();
    } finally {
      if (db != null) {
        Tables.getInstance().getDatabase().closeDatabase(getAppName(), db);
      }
    }
  }

  private void initializeDisplayNamePreference(OdkDbHandle db) throws RemoteException {
    EditTextPreference displayPref = this
        .findEditTextPreference(Constants.PreferenceKeys.Table.DISPLAY_NAME);

    String rawDisplayName = TableUtil.get().getRawDisplayName(Tables.getInstance(), getAppName(), db, getTableId());

    displayPref.setSummary(rawDisplayName);
  }

  private void initializeTableIdPreference() {
    EditTextPreference idPref = this
        .findEditTextPreference(Constants.PreferenceKeys.Table.TABLE_ID);
    idPref.setSummary(getTableId());
  }

  private void initializeDefaultViewType() throws RemoteException {
    // We have to set the current default view and disable the entries that
    // don't apply to this table.
    DefaultViewTypePreference viewPref = (DefaultViewTypePreference) this
        .findListPreference(Constants.PreferenceKeys.Table.DEFAULT_VIEW_TYPE);
    viewPref.setFields(getTableId(), getColumnDefinitions());
    viewPref.setOnPreferenceChangeListener(new OnPreferenceChangeListener() {

      @Override
      public boolean onPreferenceChange(Preference preference, Object newValue) {
        WebLogger.getLogger(getAppName()).e(TAG,
            "[onPreferenceChange] for default view preference. Pref is: " + newValue);
        String selectedValue = newValue.toString();
        PreferenceUtil.setDefaultViewType(getActivity(), getAppName(), getTableId(),
            TableViewType.valueOf(selectedValue));
        return true;
      }
    });
  }

  private void initializeDefaultForm() {
    EditFormDialogPreference formPref = (EditFormDialogPreference) this
        .findPreference(Constants.PreferenceKeys.Table.DEFAULT_FORM);
    // TODO:
  }

  private void initializeTableColorRules() {
    Preference tableColorPref = this
        .findPreference(Constants.PreferenceKeys.Table.TABLE_COLOR_RULES);
    tableColorPref.setOnPreferenceClickListener(new OnPreferenceClickListener() {

      @Override
      public boolean onPreferenceClick(Preference preference) {
        // pop in the list of columns.
        TableLevelPreferencesActivity activity = (TableLevelPreferencesActivity) getActivity();
        activity.showColorRuleListFragment(null, ColorRuleGroup.Type.TABLE);
        return false;
      }
    });
  }

  private void initializeListFile(OdkDbHandle db) throws RemoteException {
    FileSelectorPreference listPref = (FileSelectorPreference) this
        .findPreference(Constants.PreferenceKeys.Table.LIST_FILE);
    listPref.setFields(this, Constants.RequestCodes.CHOOSE_LIST_FILE,
        ((AbsBaseActivity) getActivity()).getAppName());
    listPref.setSummary(TableUtil.get().getListViewFilename(Tables.getInstance(), getAppName(), db, getTableId()));
  }

  private void initializeMapListFile(OdkDbHandle db) throws RemoteException {
    FileSelectorPreference mapListPref = (FileSelectorPreference) this
        .findPreference(Constants.PreferenceKeys.Table.MAP_LIST_FILE);
    mapListPref.setFields(this, Constants.RequestCodes.CHOOSE_MAP_FILE,
        ((AbsBaseActivity) getActivity()).getAppName());
    String mapListViewFileName = TableUtil.get().getMapListViewFilename(Tables.getInstance(), getAppName(), db, getTableId());
    WebLogger.getLogger(getAppName()).d(TAG,
        "[initializeMapListFile] file is: " + mapListViewFileName);
    mapListPref.setSummary(mapListViewFileName);
  }

  private void initializeDetailFile(OdkDbHandle db) throws RemoteException {
    FileSelectorPreference detailPref = (FileSelectorPreference) this
        .findPreference(Constants.PreferenceKeys.Table.DETAIL_FILE);
    detailPref.setFields(this, Constants.RequestCodes.CHOOSE_DETAIL_FILE,
        ((AbsBaseActivity) getActivity()).getAppName());
    detailPref.setSummary(TableUtil.get().getDetailViewFilename(Tables.getInstance(), getAppName(), db, getTableId()));
  }

  private void initializeStatusColorRules() {
    Preference statusColorPref = this
        .findPreference(Constants.PreferenceKeys.Table.STATUS_COLOR_RULES);
    statusColorPref.setOnPreferenceClickListener(new OnPreferenceClickListener() {

      @Override
      public boolean onPreferenceClick(Preference preference) {
        // pop in the list of columns.
        TableLevelPreferencesActivity activity = (TableLevelPreferencesActivity) getActivity();
        activity.showColorRuleListFragment(null, ColorRuleGroup.Type.STATUS_COLUMN);
        return false;
      }
    });
  }

  private void initializeMapColorRule() {
    ListPreference mapColorPref = this
        .findListPreference(Constants.PreferenceKeys.Table.MAP_COLOR_RULE);
    // TODO:
  }

  private void initializeColumns() {
    Preference columnPref = this.findPreference(Constants.PreferenceKeys.Table.COLUMNS);
    columnPref.setOnPreferenceClickListener(new OnPreferenceClickListener() {

      @Override
      public boolean onPreferenceClick(Preference preference) {
        // pop in the list of columns.
        TableLevelPreferencesActivity activity = (TableLevelPreferencesActivity) getActivity();
        activity.showColumnListFragment();
        return false;
      }
    });
  }

  private String getRelativePathOfFile(String fullPath) {
    String relativePath = ODKFileUtils.asRelativePath(
        ((AbsBaseActivity) getActivity()).getAppName(), new File(fullPath));
    return relativePath;
  }

}
