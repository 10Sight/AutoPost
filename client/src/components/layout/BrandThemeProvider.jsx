import React, { useLayoutEffect, useEffect } from "react";
import { useSelector } from "react-redux";
import { useGetPublicOrganizationQuery, useGetOrganizationQuery } from "../../redux/slices/organizationApiSlice";
import { hexToRgbValues, getContrastColor, isValidHex } from "../../lib/colorUtils";

const CACHE_KEY = "autopost_branding_cache";

/**
 * BrandThemeProvider manages the visual identity of the workspace.
 * It dynamically synchronizes organization branding with the application's
 * CSS variable system and browser metadata.
 */
const BrandThemeProvider = ({ children }) => {
    const { token } = useSelector((state) => state.auth);

    // Determine the tenant slug from the environment (URL subdomain or query param)
    const getTenantSlug = () => {
        const hostname = window.location.hostname;
        const searchParams = new URLSearchParams(window.location.search);
        
        if (searchParams.has("org")) return searchParams.get("org");
        const parts = hostname.split(".");
        if (parts.length >= 3 && parts[0] !== "www") {
            return parts[0];
        }
        return null; 
    };

    const tenantSlug = getTenantSlug();

    // Strategy 1: Load from API (Stale-While-Revalidate)
    const publicOrg = useGetPublicOrganizationQuery(tenantSlug, { skip: !!token });
    const privateOrg = useGetOrganizationQuery(undefined, { skip: !token });
    const currentOrgQuery = token ? privateOrg : publicOrg;
    
    // Strategy 2: Immediate Persistence (Anti-Flash)
    // We try to find a cached theme to use while Strategy 1 is loading
    const getCachedBranding = () => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            return null;
        }
    };

    const apiBranding = currentOrgQuery?.data?.data?.branding;
    const cachedBranding = getCachedBranding();
    
    // Choose the best available branding: 
    // Newest API > Cached Persistence > Hardcoded Defaults
    const branding = apiBranding || cachedBranding || {};

    // Persist successful API results for the next refresh
    useEffect(() => {
        if (apiBranding) {
            localStorage.setItem(CACHE_KEY, JSON.stringify(apiBranding));
        }
    }, [apiBranding]);

    // Handle cache clearing on logout
    useEffect(() => {
        if (!token && !tenantSlug) {
            localStorage.removeItem(CACHE_KEY);
        }
    }, [token, tenantSlug]);
    
    const primary = branding.primaryColor && isValidHex(branding.primaryColor) 
        ? branding.primaryColor 
        : "#2563eb"; // Fallback to 10Sight Blue
        
    const accent = branding.accentColor && isValidHex(branding.accentColor)
        ? branding.accentColor
        : "#4f46e5"; // Fallback to Indigo

    const background = branding.backgroundColor && isValidHex(branding.backgroundColor)
        ? branding.backgroundColor
        : "#ffffff"; // Fallback to White

    useLayoutEffect(() => {
        const root = document.documentElement;
        const primaryRgb = hexToRgbValues(primary);
        const accentRgb = hexToRgbValues(accent);
        const backgroundRgb = hexToRgbValues(background);
        const foregroundRgb = getContrastColor(primary);

        // 1. Inject CSS Variables
        root.style.setProperty("--primary", primary);
        root.style.setProperty("--primary-rgb", primaryRgb);
        root.style.setProperty("--primary-foreground", `rgb(${foregroundRgb})`);
        
        root.style.setProperty("--accent", accent);
        root.style.setProperty("--accent-rgb", accentRgb);

        root.style.setProperty("--background", background);
        root.style.setProperty("--background-rgb", backgroundRgb);

        // 2. Browser Tab/Metadata Sync
        if (currentOrgQuery?.data?.data?.name) {
            document.title = `${currentOrgQuery.data.data.name} | AutoPost`;
        }
        
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement("meta");
            metaThemeColor.name = "theme-color";
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = primary;

        // 3. Dynamic Favicon
        if (branding.logoUrl) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement("link");
                link.rel = "icon";
                document.head.appendChild(link);
            }
            link.href = branding.logoUrl;
        }

        // 4. Smooth Transitions Styles
        if (!document.getElementById("theme-transition-styles")) {
            const style = document.createElement("style");
            style.id = "theme-transition-styles";
            style.innerHTML = `
                * {
                    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.1s ease;
                }
                .no-transition * {
                    transition: none !important;
                }
            `;
            document.head.appendChild(style);
        }

    }, [primary, accent, background, branding.logoUrl, currentOrgQuery?.data]);

    return <>{children}</>;
};

export default BrandThemeProvider;
