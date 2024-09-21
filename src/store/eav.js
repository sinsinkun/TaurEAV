import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { invoke } from "@tauri-apps/api/tauri";

export const fnsWithPaginationEnum = {
  none: null,
  fetchEntities: "fetchEntities",
  searchEntity: "searchEntity",
  searchAttrValue: "searchAttrValue",
  searchAttrValueComparison: "searchAttrValueComparison",
  fetchValues: "fetchValues", // not an entity fetch
}

export const connect = createAsyncThunk(
  'eav/connect',
  async (_, { rejectWithValue }) => {
    try {
      const res = await invoke("connect");
      if (res !== "OK") rejectWithValue(false);
      return true;
    } catch (e) {
      console.error("Connection failed -", e);
      return rejectWithValue(false);
    }
  }
)

export const fetchEntityTypes = createAsyncThunk(
  'eav/fetchEntityTypes',
  async (_, { rejectWithValue }) => {
    try {
      const res = await invoke("fetch_entity_types");
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const fetchEntities = createAsyncThunk(
  'eav/fetchEntities',
  async ({ id, page }, { rejectWithValue }) => {
    try {
      const res = await invoke("fetch_entities", { entityTypeId: id, page });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  },
  {
    condition: (_, { getState }) => {
      const loading = getState()?.eav?.loading ?? true;
      if (loading) return false;
    }
  }
)

export const fetchValues = createAsyncThunk(
  'eav/fetchValues',
  async (entityId, { rejectWithValue }) => {
    try {
      const res = await invoke("fetch_values", { entityId });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  },
  {
    condition: (_, { getState }) => {
      const loading = getState()?.eav?.loading ?? true;
      if (loading) return false;
    }
  }
)

export const addAttribute = createAsyncThunk(
  'eav/addAttribute',
  async (input, { rejectWithValue }) => {
    try {
      const { attr, value_type, entity_type_id, allow_multiple } = input;
      if (!attr || !value_type || !entity_type_id) throw new Error("Missing required inputs");
      const res = await invoke("create_attr", { 
        entity_type_id, 
        attr_name: attr, 
        attr_type: value_type, 
        allow_multiple,
      });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const addEntity = createAsyncThunk(
  'eav/addEntity',
  async (input, { rejectWithValue }) => {
    try {
      const { entity, entity_type } = input;
      if (!entity || !entity_type) throw new Error("Missing required inputs");
      const res = await invoke("create_entity", { entity, entity_type });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const addEntityType = createAsyncThunk(
  'eav/addEntityType',
  async (input, { rejectWithValue }) => {
    try {
      const { entity_type } = input;
      if (!entity_type) throw new Error("Missing required inputs");
      const res = await invoke("create_entity_type", { entity_type });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const addValue = createAsyncThunk(
  'eav/addValue',
  async (input, { rejectWithValue }) => {
    try {
      const { entity_id, attr_id, value_str, value_int, value_float, value_time, value_bool } = input;
      if (!entity_id || !attr_id) throw new Error("Missing required inputs");
      const fnInput = {
        id: 0, created_at: new Date().toISOString(), entity_id, attr_id, 
        value_str, value_int, value_float, value_time, value_bool
      }
      const res = await invoke("create_value", { input: fnInput });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const updateValue = createAsyncThunk(
  'eav/updateValue',
  async (input, { rejectWithValue }) => {
    try {
      const { value_id, created_at, entity_id, attr_id, value_str, value_int, value_float, value_time, value_bool } = input;
      if (!value_id) throw new Error("Missing required inputs");
      const fnInput = {
        id: value_id, created_at, entity_id, attr_id, 
        value_str, value_int, value_float, value_time, value_bool
      }
      const res = await invoke("update_value", { input: fnInput });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const deleteEntityType = createAsyncThunk(
  'eav/deleteEntityType',
  async (id, { rejectWithValue }) => {
    try {
      if (!id) throw new Error("No id provided");
      await invoke("delete_entity_type", { id });
      return id;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const deleteEntity = createAsyncThunk(
  'eav/deleteEntity',
  async (id, { rejectWithValue }) => {
    try {
      if (!id) throw new Error("No id provided");
      await invoke("delete_entity", { id });
      return id;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const deleteValue = createAsyncThunk(
  'eav/deleteValue',
  async (id, { rejectWithValue }) => {
    try {
      if (!id) throw new Error("No id provided");
      await invoke("delete_value", { id });
      return id;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  }
)

export const searchEntity = createAsyncThunk(
  'eav/searchEntity',
  async ({ regex, extended, page }, { rejectWithValue }) => {
    try {
      if (!regex) return [];
      const res = await invoke("search_entity", { regex, extended, page });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  },
  {
    condition: (_, { getState }) => {
      const loading = getState()?.eav?.loading ?? true;
      if (loading) return false;
    }
  }
)

export const searchAttrValue = createAsyncThunk(
  'eav/searchAttrValue',
  async ({ attr, val, page }, { rejectWithValue }) => {
    try {
      if (!attr || !val) return [];
      let res = await invoke("search_entity_with_attr_value", { attr, val, page });
      if (["FALSE", "False", "false", "No", "no", "n", "NULL", "null"].includes(val)) {
        // also search for null values
        const append = await invoke("search_entity_without_attr", { attr, page });
        res = [...res, ...append];
      }
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  },
  {
    condition: (_, { getState }) => {
      const loading = getState()?.eav?.loading ?? true;
      if (loading) return false;
    }
  }
)

export const searchAttrValueComparison = createAsyncThunk(
  'eav/searchAttrValueComparison',
  async ({ attr, val, op, page }, { rejectWithValue }) => {
    try {
      if (!attr || !val || !op) return [];
      let res = await invoke("search_entity_with_attr_value_comparison", { attr, val, op, page });
      return res;
    } catch (e) {
      console.error("API failed -", e);
      return rejectWithValue(null);
    }
  },
  {
    condition: (_, { getState }) => {
      const loading = getState()?.eav?.loading ?? true;
      if (loading) return false;
    }
  }
)

export const eavSlice = createSlice({
  name: 'eav',
  initialState: {
    loading: false,
    connected: false,
    entityTypes: [],
    entities: [],
    values: [],
    formType: null,
    formInput: {},
    activeEnType: null,
    activeEntity: null,
    showDelete: false,
    showHelp: false,
    entityMeta: {
      fn: fnsWithPaginationEnum.none,
      page: 1,
    }
  },
  reducers: {
    clearEntityTypes: (state) => {
      state.entityTypes = []
    },
    clearEntities: (state) => {
      state.entities = []
    },
    clearValues: (state) => {
      state.values = []
    },
    openForm: (state, action) => {
      state.formType = action.payload
    },
    closeForm: (state) => {
      state.formType = null
    },
    setFormInput: (state, action) => {
      state.formInput = action.payload;
    },
    setActiveEnType: (state, action) => {
      const [active] = state.entityTypes.filter(x => x.id === action.payload);
      if (active) state.activeEnType = active;
    },
    setActiveEntity: (state, action) => {
      if (action.payload === 0) {
        state.activeEntity = null;
        return;
      }
      const [active] = state.entities.filter(x => x.id === action.payload);
      if (active) state.activeEntity = active;
    },
    toggleShowDel: (state) => {
      state.showDelete = !state.showDelete;
    },
    toggleShowHelp: (state) => {
      state.showHelp = !state.showHelp;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(connect.pending, (state) => {
      state.loading = true;
    }).addCase(connect.fulfilled, (state) => {
      state.loading = false;
      state.connected = true;
    }).addCase(connect.rejected, (state) => {
      state.loading = false;
      state.connected = false;
    });
    builder.addCase(fetchEntityTypes.pending, (state) => {
      state.loading = true;
    }).addCase(fetchEntityTypes.fulfilled, (state, action) => {
      state.loading = false;
      state.entityTypes = action.payload;
      state.activeEntity = null;
    }).addCase(fetchEntityTypes.rejected, (state) => {
      state.loading = false;
      state.entityTypes = [];
    });
    builder.addCase(fetchEntities.pending, (state) => {
      state.loading = true;
    }).addCase(fetchEntities.fulfilled, (state, action) => {
      state.loading = false;
      state.entityMeta = {
        fn: fnsWithPaginationEnum.fetchEntities,
        id: action.meta.arg?.id,
        page: action.meta.arg?.page || 1,
      }
      if (action.payload.length < 1) state.entityMeta.end = true;
      if (action.meta.arg?.page > 1) state.entities = [...state.entities, ...action.payload];
      else state.entities = action.payload;
      state.activeEntity = null;
    }).addCase(fetchEntities.rejected, (state) => {
      state.loading = false;
      state.entities = [];
    });
    builder.addCase(fetchValues.pending, (state) => {
      state.loading = true;
    }).addCase(fetchValues.fulfilled, (state, action) => {
      state.loading = false;
      state.values = action.payload;
    }).addCase(fetchValues.rejected, (state) => {
      state.loading = false;
      state.values = [];
    });
    builder.addCase(addAttribute.pending, (state) => {
      state.loading = true;
    }).addCase(addAttribute.fulfilled, (state, action) => {
      state.loading = false;
      if (state.values.length < 1) return;
      const firstValue = state.values[0];
      // build view representation
      const view = {
        entityTypeId: action.payload.entityTypeId,
        entityType: firstValue.entityType,
        entityId: firstValue.entityId,
        entity: firstValue.entity,
        attrId: action.payload.id,
        attr: action.payload.attr,
        valueType: action.payload.valueType,
        allowMultiple: action.payload.allowMultiple,
        valueId: null,
      }
      // push to end
      state.values.push(view);
    }).addCase(addAttribute.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(addEntity.pending, (state) => {
      state.loading = true;
    }).addCase(addEntity.fulfilled, (state, action) => {
      state.loading = false;
      state.entities.push(action.payload);
    }).addCase(addEntity.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(addEntityType.pending, (state) => {
      state.loading = true;
    }).addCase(addEntityType.fulfilled, (state, action) => {
      state.loading = false;
      state.entityTypes.push(action.payload);
    }).addCase(addEntityType.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(addValue.pending, (state) => {
      state.loading = true;
    }).addCase(addValue.fulfilled, (state, action) => {
      state.loading = false;
      // determine if adding new row or modifying existing row
      let newRow = null;
      let idx = -1;
      state.values.forEach((v, i) => {
        if (v.attr_id === action.payload.attr_id && v.entity_id === action.payload.entity_id) {
          if (!v.value_id) {
            idx = i;
            if (v.allow_multiple) newRow = { ...v };
          }
        }
      })
      // update existing state
      if (idx > -1) {
        state.values[idx].value_id = action.payload.id;
        state.values[idx].created_at = action.payload.created_at;
        state.values[idx].value_str = action.payload.value_str;
        state.values[idx].value_int = action.payload.value_int;
        state.values[idx].value_float = action.payload.value_float;
        state.values[idx].value_time = action.payload.value_time;
        state.values[idx].value_bool = action.payload.value_bool;
        if (newRow) state.values.splice(idx+1, 0, newRow);
      }
    }).addCase(addValue.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(updateValue.pending, (state) => {
      state.loading = true;
    }).addCase(updateValue.fulfilled, (state, action) => {
      state.loading = false;
      let idx = -1;
      state.values.forEach((v, i) => {
        if (v.value_id === action.payload.id) idx = i;
      })
      // update existing state
      if (idx > -1) {
        state.values[idx].value_str = action.payload.value_str;
        state.values[idx].value_int = action.payload.value_int;
        state.values[idx].value_float = action.payload.value_float;
        state.values[idx].value_time = action.payload.value_time;
        state.values[idx].value_bool = action.payload.value_bool;
      }
    }).addCase(updateValue.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(deleteEntityType.pending, (state) => {
      state.loading = true;
    }).addCase(deleteEntityType.fulfilled, (state, action) => {
      state.loading = false;
      let idx = -1;
      state.entityTypes.forEach((e, i) => {
        if (e.id === action.payload) idx = i;
      })
      if (idx > -1) state.entityTypes.splice(idx, 1);
    }).addCase(deleteEntityType.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(deleteEntity.pending, (state) => {
      state.loading = true;
    }).addCase(deleteEntity.fulfilled, (state, action) => {
      state.loading = false;
      let idx = -1;
      state.entities.forEach((e, i) => {
        if (e.id === action.payload) idx = i;
      })
      if (idx > -1) state.entities.splice(idx, 1);
    }).addCase(deleteEntity.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(deleteValue.pending, (state) => {
      state.loading = true;
    }).addCase(deleteValue.fulfilled, (state, action) => {
      state.loading = false;
      let idx = -1;
      state.values.forEach((e, i) => {
        if (e.value_id === action.payload) idx = i;
      })
      if (idx > -1) state.values.splice(idx, 1);
    }).addCase(deleteValue.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(searchEntity.pending, (state) => {
      state.loading = true;
      state.activeEnType = null;
    }).addCase(searchEntity.fulfilled, (state, action) => {
      state.loading = false;
      state.entities = action.payload;
      state.activeEntity = null;
    }).addCase(searchEntity.rejected, (state) => {
      state.loading = false;
      state.entities = [];
    });
    builder.addCase(searchAttrValue.pending, (state) => {
      state.loading = true;
      state.activeEnType = null;
    }).addCase(searchAttrValue.fulfilled, (state, action) => {
      state.loading = false;
      state.entities = action.payload;
      state.activeEntity = null;
    }).addCase(searchAttrValue.rejected, (state) => {
      state.loading = false;
      state.entities = [];
    });
    builder.addCase(searchAttrValueComparison.pending, (state) => {
      state.loading = true;
      state.activeEnType = null;
    }).addCase(searchAttrValueComparison.fulfilled, (state, action) => {
      state.loading = false;
      state.entities = action.payload;
      state.activeEntity = null;
    }).addCase(searchAttrValueComparison.rejected, (state) => {
      state.loading = false;
      state.entities = [];
    });
  }
});

export const {
  clearEntityTypes,
  clearEntities,
  clearValues,
  openForm,
  closeForm,
  setFormInput,
  setActiveEnType,
  setActiveEntity,
  toggleShowDel,
  toggleShowHelp,
} = eavSlice.actions;

export default eavSlice.reducer;