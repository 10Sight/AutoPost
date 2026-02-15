import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api";
import authReducer from "../features/auth/authSlice";
import { setupListeners } from "@reduxjs/toolkit/query";
import { rtkQueryErrorLogger } from "./rtkQueryErrorLogger";

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware).concat(rtkQueryErrorLogger),
    devTools: true,
});

setupListeners(store.dispatch);
