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

package org.opendatakit.tables.fragments;

import static org.fest.assertions.api.ANDROID.assertThat;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.opendatakit.common.android.application.CommonApplication;
import org.opendatakit.tables.activities.TableDisplayActivity.ViewFragmentType;
import org.opendatakit.tables.activities.TableDisplayActivityStub;
import org.opendatakit.testutils.ODKFragmentTestUtil;
import org.opendatakit.testutils.TestCaseUtils;
import org.opendatakit.testutils.TestConstants;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.shadows.ShadowLog;

import android.app.Activity;
import android.app.FragmentManager;
import android.view.View;
import android.widget.TextView;

@RunWith(RobolectricTestRunner.class)
public class SpreadsheetFragmentTest {

  SpreadsheetFragment fragment;
  Activity activity;

  private void doGlobalSetup(String tableId) {
    TestCaseUtils.setExternalStorageMounted();
    activity = ODKFragmentTestUtil.startFragmentForTableDisplayActivity(
        ViewFragmentType.SPREADSHEET, tableId);
    FragmentManager mgr = activity.getFragmentManager();
    fragment = (SpreadsheetFragment) mgr.findFragmentByTag(ViewFragmentType.SPREADSHEET.name());
  }

  @Before
  public void before() {
    ShadowLog.stream = System.out;
    // We don't want to build the menu here, as it doesn't
    // give us any information in this test class.
    TableDisplayActivityStub.BUILD_MENU_FRAGMENT = false;
  }

  private void setupWithNoData() {
    CommonApplication.setMocked();
    TestCaseUtils.setExternalStorageMounted();
    
    TestCaseUtils.setOneTableDataset();

    doGlobalSetup(TestConstants.DEFAULT_EMPTY_TABLE_ID);
  }

  private void setupWithData() {
    CommonApplication.setMocked();
    TestCaseUtils.setExternalStorageMounted();
    
    TestCaseUtils.setThreeTableDataset(true);

    doGlobalSetup(TestConstants.DEFAULT_TABLE_ID);
  }

  @After
  public void after() {
    TestCaseUtils.resetExternalStorageState();
  }

  @Test
  public void viewWithWidthZeroIsTextView() {
    this.setupWithNoData();
    View fragmentView = this.fragment.getView();
    assertThat(fragmentView)
        .isNotNull()
        .isInstanceOf(TextView.class);
  }

  // this mofo is super complicated atm.
//  @Test
//  public void viewWithDataIsSpreadsheetView() {
//    this.setupWithData();
//    View fragmentView = this.fragment.getView();
//    assertThat(fragmentView)
//        .isNotNull()
//        .isInstanceOf(SpreadsheetView.class);
//  }

}
