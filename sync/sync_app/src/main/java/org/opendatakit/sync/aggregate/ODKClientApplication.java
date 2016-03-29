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

package org.opendatakit.sync.aggregate;

import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.core.Application;

import org.apache.wink.common.internal.providers.entity.FileProvider;

public class ODKClientApplication extends Application {

    @Override
    public Set<Class<?>> getClasses() {
      final java.util.HashSet<java.lang.Class<?>> classes = new HashSet<Class<?>>();
      
      // standard content stream reader/writer
      classes.add(SimpleJSONMessageReaderWriter.class);
      classes.add(FileProvider.class);
      return classes;
    }
}
