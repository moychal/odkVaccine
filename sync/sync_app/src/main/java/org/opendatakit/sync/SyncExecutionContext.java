/*
 * Copyright (C) 2014 University of Washington
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

package org.opendatakit.sync;

import android.accounts.Account;
import android.accounts.AccountManager;
import org.opendatakit.common.android.application.CommonApplication;
import org.opendatakit.common.android.logic.CommonToolProperties;
import org.opendatakit.common.android.logic.PropertiesSingleton;
import org.opendatakit.common.android.utilities.CsvUtil;
import org.opendatakit.common.android.utilities.WebLogger;
import org.opendatakit.database.service.OdkDbHandle;
import org.opendatakit.sync.SynchronizationResult.Status;
import org.opendatakit.sync.Synchronizer.SynchronizerStatus;
import org.opendatakit.sync.application.Sync;
import org.opendatakit.sync.logic.SyncToolProperties;
import org.opendatakit.sync.service.SyncNotification;
import org.opendatakit.sync.service.SyncProgressState;

import android.os.RemoteException;

import com.fasterxml.jackson.annotation.JsonAutoDetect.Visibility;
import com.fasterxml.jackson.databind.ObjectMapper;

public class SyncExecutionContext implements SynchronizerStatus {

  private static final String TAG = "SyncExecutionContext";
  private static final String ACCOUNT_TYPE_G = "com.google";

  private static final int OVERALL_PROGRESS_BAR_LENGTH = 6350400;
  private static final ObjectMapper mapper;

  static {
    mapper = new ObjectMapper();
    mapper.setVisibilityChecker(mapper.getVisibilityChecker().withFieldVisibility(Visibility.ANY));
  }
  
  /**
   * The results of the synchronization that we will pass back to the user.
   */
  private final SynchronizationResult mUserResult;

  private int nMajorSyncSteps;
  private int iMajorSyncStep;
  private int GRAINS_PER_MAJOR_SYNC_STEP;

  private final CommonApplication context;
  private final String appName;
  private final String odkClientApiVersion;
  private final String aggregateUri;
  private final SyncNotification syncProgress;
  private final CsvUtil utils;

  // set this later
  private Synchronizer synchronizer;

  private OdkDbHandle odkDbHandle = null;
  
  public SyncExecutionContext(CommonApplication context, String appName,
      String odkClientApiVersion, String aggregateUri,
      SyncNotification syncProgress,
      SynchronizationResult syncResult) {
    this.context = context;
    this.appName = appName;
    this.odkClientApiVersion = odkClientApiVersion;
    this.aggregateUri = aggregateUri;
    this.syncProgress = syncProgress;
    this.synchronizer = null;
    this.utils = new CsvUtil(context, appName);
    this.mUserResult = syncResult;
    
    this.nMajorSyncSteps = 1;
    this.GRAINS_PER_MAJOR_SYNC_STEP = (OVERALL_PROGRESS_BAR_LENGTH / nMajorSyncSteps);
    this.iMajorSyncStep = 0;

  }

  public void setSynchronizer(Synchronizer synchronizer) {
    this.synchronizer = synchronizer;
  }

  public String getString(int resId) {
    return context.getString(resId);
  }
  
  public void setAppLevelStatus(Status status) {
    mUserResult.setAppLevelStatus(status);
  }
  
  public TableResult getTableResult(String tableId) {
    return mUserResult.getTableResult(tableId);
  }
  
  public String getAppName() {
    return this.appName;
  }

  public String getOdkClientApiVersion() {
    return this.odkClientApiVersion;
  }

  public String getAggregateUri() {
    return this.aggregateUri;
  }

  public CsvUtil getCsvUtil() {
    return this.utils;
  }
  
  public Synchronizer getSynchronizer() {
    return synchronizer;
  }

  public AccountManager getAccountManager() {
    AccountManager accountManager = AccountManager.get(context);
    return accountManager;
  }

  public Account getAccount() {
    PropertiesSingleton props = SyncToolProperties.get(context, getAppName());
    Account account = new Account(props.getProperty(CommonToolProperties.KEY_ACCOUNT), ACCOUNT_TYPE_G);
    return account;
  }

  private int refCount = 1;

  public synchronized OdkDbHandle getDatabase() throws RemoteException {
    if ( odkDbHandle == null ) {
      odkDbHandle = Sync.getInstance().getDatabase().openDatabase(appName);
    }
    if ( odkDbHandle == null ) {
      throw new IllegalStateException("Unable to obtain database handle from Core Services!");
    }
    ++refCount;
    return odkDbHandle;
  }

  public synchronized void releaseDatabase(OdkDbHandle odkDbHandle) throws RemoteException {
    if ( odkDbHandle != null ) {
      if ( odkDbHandle != this.odkDbHandle ) {
        throw new IllegalArgumentException("Expected the internal odkDbHandle!");
      }
      --refCount;
      if ( refCount == 0 ) {
        try {
          Sync.getInstance().getDatabase().closeDatabase(appName, odkDbHandle);
          this.odkDbHandle = null;
        } catch ( Exception e ) {
          WebLogger.getLogger(appName).printStackTrace(e);
        }
        throw new IllegalStateException("should never get here");
      }
    }
  }

  public void resetMajorSyncSteps(int nMajorSyncSteps) {
    this.nMajorSyncSteps = nMajorSyncSteps;
    this.GRAINS_PER_MAJOR_SYNC_STEP = (OVERALL_PROGRESS_BAR_LENGTH / nMajorSyncSteps);
    this.iMajorSyncStep = 0;
  }
  
  public void incMajorSyncStep() {
    ++iMajorSyncStep;
    if ( iMajorSyncStep > nMajorSyncSteps ) {
      iMajorSyncStep = nMajorSyncSteps - 1;
    }
  }
  
  @Override
  public void updateNotification(SyncProgressState state, int textResource, Object[] formatArgVals,
      Double progressPercentage, boolean indeterminateProgress) {
    String text = "Bad text resource id: " + textResource + "!";
    String fmt = context.getString(textResource);
    if (fmt != null) {
      if (formatArgVals == null) {
        text = fmt;
      } else {
        text = String.format(fmt, formatArgVals);
      }
    }
    syncProgress.updateNotification(state, text, OVERALL_PROGRESS_BAR_LENGTH, (int) (iMajorSyncStep
        * GRAINS_PER_MAJOR_SYNC_STEP + ((progressPercentage != null) ? (progressPercentage
        * GRAINS_PER_MAJOR_SYNC_STEP / 100.0) : 0.0)), indeterminateProgress);
  }

}
