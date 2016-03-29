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

package org.opendatakit.common.android.database;

import org.opendatakit.common.android.utilities.StaticStateManipulator;
import org.opendatakit.common.android.utilities.StaticStateManipulator.IStaticFieldManipulator;
import org.opendatakit.common.android.utilities.WebLogger;

public final class AndroidConnectFactory  extends OdkConnectionFactoryAbstractClass {

  static {
    OdkConnectionFactorySingleton.set(new AndroidConnectFactory());

    // register a state-reset manipulator for 'connectionFactory' field.
    StaticStateManipulator.get().register(50, new IStaticFieldManipulator() {

      @Override
      public void reset() {
        OdkConnectionFactorySingleton.set(new AndroidConnectFactory());
      }

    });
  }

  public static void configure() {
    // just to get the static initialization block (above) to run
  }

  private AndroidConnectFactory() {
  }

  @Override
  protected void logInfo(String appName, String message) {
    WebLogger.getLogger(appName).i("AndroidConnectFactory", message);
  }

  @Override
  protected void logWarn(String appName, String message) {
    WebLogger.getLogger(appName).w("AndroidConnectFactory", message);
  }

  @Override
  protected void logError(String appName, String message) {
    WebLogger.getLogger(appName).e("AndroidConnectFactory", message);
  }

  @Override
  protected void printStackTrace(String appName, Throwable e) {
    WebLogger.getLogger(appName).printStackTrace(e);
  }

   @Override
   protected OdkConnectionInterface openDatabase(AppNameSharedStateContainer appNameSharedStateContainer,
       String sessionQualifier) {
      return AndroidOdkConnection.openDatabase(appNameSharedStateContainer,
          sessionQualifier);
   }
}
