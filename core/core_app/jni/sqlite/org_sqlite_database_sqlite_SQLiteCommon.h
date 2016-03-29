/*
 * org_sqlite_database_sqlite_SQLiteCommon.h
 *
 *  Created on: Jan 8, 2016
 *      Author: Admin
 */

#ifndef ORG_SQLITE_DATABASE_SQLITE_SQLITECOMMON_H_
#define ORG_SQLITE_DATABASE_SQLITE_SQLITECOMMON_H_

// Special log tags defined in SQLiteDebug.java.
#define SQLITE_LOG_TAG "SQLiteLog"
#define SQLITE_TRACE_TAG "SQLiteStatements"
#define SQLITE_PROFILE_TAG "SQLiteTime"

#include "jni.h"

namespace org_opendatakit {

void sqliteInitialize(JNIEnv* env);

jlong openConnection(JNIEnv* env,
                     const char* path, jint openFlags, const char* label,
                     jboolean enableTrace, jboolean enableProfile);

void closeConnection(JNIEnv* env, jlong connectionPtr);

jlong prepareStatement(JNIEnv* env, jlong connectionPtr, jstring sqlString);

void finalizeStatement(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jint bindParameterCount(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jboolean statementIsReadOnly(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jint getColumnCount(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jstring getColumnName(JNIEnv* env, jlong connectionPtr, jlong statementPtr,
      int index);

void bindNull(JNIEnv* env, jlong connectionPtr, jlong statementPtr, int index);

void bindLong(JNIEnv* env, jlong connectionPtr, jlong statementPtr, int index,
      jlong value);

void bindDouble(JNIEnv* env, jlong connectionPtr, jlong statementPtr, int index,
      jdouble value);

void bindString(JNIEnv* env, jlong connectionPtr, jlong statementPtr, int index,
      const jchar* value, size_t valueLength);

void bindBlob(JNIEnv* env, jlong connectionPtr, jlong statementPtr, int index,
      const jbyte* value, size_t valueLength);

void resetAndClearBindings(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

// internal sqlite error code
void executeNonQuery(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jlong executeForLong(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jstring executeForString(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jint executeForChangedRowCount(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jlong executeForLastInsertedRowId(JNIEnv* env, jlong connectionPtr, jlong statementPtr);

jlong executeIntoCursorWindow(JNIEnv* env, jlong connectionPtr, jlong statementPtr,
                          jobject win,
                          jint startPos,                  /* First row to add (advisory) */
                          jint iRowRequired,              /* Required row */
                          jboolean countAllRows);

jint getDbLookasideUsed(JNIEnv* env, jlong connectionPtr);

void cancel(JNIEnv* env, jlong connectionPtr);

void resetCancel(JNIEnv* env, jlong connectionPtr, jboolean cancelable);

}

#endif /* ORG_SQLITE_DATABASE_SQLITE_SQLITECOMMON_H_ */

