import { get, post } from './myAxios.js'



//---------------------------- 数据库info --------------------------

export const api_openSyncDataBaseInfo = p => post('/dataBaseInfo/syncData', p);

//-----------------------------end--------------------------------




//---------------------------- 数据库表 ----------------------------

export const api_getTableEr = p => get('/table/er', p);
export const api_saveTables = p => post('/table/saveTables', p);

export const api_updateRelationshipLine = p => post('/table/updateRelationshipLine', p);

export const api_select = p => get('/select', p);

//-----------------------------end--------------------------------

