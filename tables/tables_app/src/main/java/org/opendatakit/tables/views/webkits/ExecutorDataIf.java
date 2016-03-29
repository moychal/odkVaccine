/*
 * Copyright (C) 2015 University of Washington
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

package org.opendatakit.tables.views.webkits;

import android.os.RemoteException;

/**
 * @author mitchellsundt@gmail.com
 *
 * Database interface from JS to Java.
 *
 * General notes on APIs:
 *
 * callbackJSON - this is a JSON serialization of a description that the caller can use to recreate
 * or retrieve the callback that will handle the response.
 *
 * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions.
 * They should be null otherwise.
 *
 * COMMON RETURN VALUE:
 *
 * All of these functions return a stringifiedJSON object.
 *
 * <pre>
 *     {
 *         transId: "openTransactionIdString",
 *         errorMsg: "message if there was an error",
 *         data: complexJSONstructure
 *     }
 * </pre>
 *
 * If the transaction was to be left open, the transId field will hold the transaction Id of the open transaction.
 *
 * If there was an error, the errorMsg field will be present. In nearly all cases, an error does not impact whether
 * a transId is returned or not. I.e., errors do not close transactions. The only situation where the transId will
 * not be returned when the transaction was to be left open is if the database connection could not be established
 * or was torn down in the midst of the request.
 *
 * If the request was a query or rawQuery, the data object will be present. It will be a JSON object
 * representation of either a UserTable, tool-specific ExtendedUserTable, or
 * a NormalizedCursor (in the case of rawQuery). Caller is expected to know from context what is
 * returned.
 */
public interface ExecutorDataIf {

    /**
     * Query the database using sql.
     *
     * @param tableId  The table being queried. This is a user-defined table.
     * @param whereClause The where clause for the query
     * @param sqlBindParams The array of bind parameter values (including any in the having clause)
     * @param groupBy The array of columns to group by
     * @param having The having clause
     * @param orderByElementKey The column to order by
     * @param orderByDirection 'ASC' or 'DESC' ordering
     * @param includeKeyValueStoreMap true if the keyValueStoreMap should be returned
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String query(String tableId, String whereClause, String[] sqlBindParams,
                        String[] groupBy, String having, String orderByElementKey, String orderByDirection,
                        boolean includeKeyValueStoreMap,
                        String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;


    /**
     * Raw SQL query
     *
     * @param sqlCommand The Select statement to issue. It can reference any table in the database, including system tables.
     * @param sqlBindParams The array of bind parameter values (including any in the having clause)
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String rawQuery(String sqlCommand, String[] sqlBindParams,
                           String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;


    /**
     * Update a row in the table
     *
     * @param tableId  The table being updated
     * @param stringifiedJSON key-value map of values to store or update. If missing, the value remains unchanged.
     * @param rowId The rowId of the row being changed.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String updateRow(String tableId, String stringifiedJSON, String rowId,
                            String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;


    /**
     * Delete a row from the table
     *
     * @param tableId  The table being updated
     * @param stringifiedJSON key-value map of values to store or update. If missing, the value remains unchanged.
     * @param rowId The rowId of the row being deleted.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String deleteRow(String tableId, String stringifiedJSON, String rowId,
                            String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;


    /**
     * Add a row in the table
     *
     * @param tableId  The table being updated
     * @param stringifiedJSON key-value map of values to store or update. If missing, the value remains unchanged.
     * @param rowId The rowId of the row being added.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String addRow(String tableId, String stringifiedJSON, String rowId,
                         String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;



    /**
     * Update the row, marking the updates as a checkpoint save.
     *
     * @param tableId  The table being updated
     * @param stringifiedJSON key-value map of values to store or update. If missing, the value remains unchanged.
     * @param rowId The rowId of the row being added.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String addCheckpoint(String tableId, String stringifiedJSON, String rowId,
                                String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;


    /**
     * Save checkpoint as incomplete. In the process, it applies any changes indicated by the stringifiedJSON.
     *
     * @param tableId  The table being updated
     * @param stringifiedJSON key-value map of values to store or update. If missing, the value remains unchanged.
     * @param rowId The rowId of the row being saved-as-incomplete.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String saveCheckpointAsIncomplete(String tableId, String stringifiedJSON, String rowId,
                                             String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;


    /**
     * Save checkpoint as complete. In the process, it applies any changes indicated by the stringifiedJSON.
     *
     * @param tableId  The table being updated
     * @param stringifiedJSON key-value map of values to store or update. If missing, the value remains unchanged.
     * @param rowId The rowId of the row being marked-as-complete.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String saveCheckpointAsComplete(String tableId, String stringifiedJSON, String rowId,
                                           String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;

    /**
     * Delete last checkpoint.  Checkpoints accumulate; this removes the most recent one, leaving earlier ones.
     *
     * @param tableId  The table being updated
     * @param rowId The rowId of the row being saved-as-incomplete.
     * @param transId null or the id of an open transaction if action should occur on an existing transaction.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @param leaveTransactionOpen null or false close the transaction or use a transient one. true will return
     *                             the transId and leave transaction open.
     * @return see description in class header
     *
     * transId and leaveTransactionOpen are used only if the user wants to explicitly control db transactions
     */
    public String deleteLastCheckpoint (String tableId, String rowId,
                                        String callbackJSON, String transId, Boolean leaveTransactionOpen)
            throws RemoteException;

    /**
     * Close transaction
     *
     * @param transId the id of an open transaction.
     * @param commitTransaction true if the transaction should be committed; false if it should be rolled back.
     * @param callbackJSON The JSON object used by the JS layer to recover the callback function
     *                     that can process the response
     * @return see description in class header
     */
    public String closeTransaction(String transId, boolean commitTransaction, String callbackJSON)
            throws RemoteException;
}
