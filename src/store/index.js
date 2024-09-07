import { configureStore } from '@reduxjs/toolkit';

import eavReducer from './eav';

export default configureStore({
  reducer: {
    eav: eavReducer,
  }
});