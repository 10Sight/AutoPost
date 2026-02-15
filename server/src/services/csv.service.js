import csvCounts from "csv-parser";
import fs from "fs";

export const validateCsv = (filePath) => {
    return new Promise((resolve, reject) => {
        const validRows = [];
        const errors = [];
        let rowCount = 0;

        fs.createReadStream(filePath)
            .pipe(csvCounts())
            .on("data", (row) => {
                rowCount++;
                const rowError = validateRow(row, rowCount);
                if (rowError) {
                    errors.push(rowError);
                } else {
                    validRows.push(formatRow(row));
                }
            })
            .on("end", () => {
                resolve({ validRows, errors, totalRows: rowCount });
            })
            .on("error", (error) => {
                reject(error);
            });
    });
};

const validateRow = (row, index) => {
    const { platform, content, date, time } = row;
    const missing = [];

    if (!platform) missing.push("platform");
    if (!content && !row.caption) missing.push("content/caption");
    if (!date) missing.push("date");
    if (!time) missing.push("time");

    if (missing.length > 0) {
        return { row: index, message: `Missing required fields: ${missing.join(", ")}` };
    }

    // Validate Platform
    const validPlatforms = ["twitter", "linkedin", "instagram", "facebook"];
    if (!validPlatforms.includes(platform.toLowerCase())) {
        return { row: index, message: `Invalid platform: ${platform}. Allowed: ${validPlatforms.join(", ")}` };
    }

    // Validate Date (Must be future)
    const scheduleDateTime = new Date(`${date} ${time}`);
    if (isNaN(scheduleDateTime.getTime())) {
        return { row: index, message: "Invalid date/time format. Use YYYY-MM-DD and HH:MM" };
    }

    if (scheduleDateTime <= new Date()) {
        return { row: index, message: "Scheduled time must be in the future" };
    }

    return null;
};

const formatRow = (row) => {
    return {
        platform: row.platform.toLowerCase(),
        caption: row.content || row.caption,
        scheduledAt: new Date(`${row.date} ${row.time}`),
        mediaUrl: row.mediaUrl || null // Optional
    };
};
