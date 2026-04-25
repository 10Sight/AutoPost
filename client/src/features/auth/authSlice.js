import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        token: null,
        isImpersonated: false,
    },
    reducers: {
        setCredentials: (state, action) => {
            const { user, token, isImpersonated } = action.payload;
            state.user = user;
            state.token = token;
            state.isImpersonated = isImpersonated || false;
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.isImpersonated = false;
        },
    },
});

export const { setCredentials, logOut } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsImpersonated = (state) => state.auth.isImpersonated;
