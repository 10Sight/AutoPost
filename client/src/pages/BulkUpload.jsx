import React, { useState } from "react";
import { useBulkCreateScheduledPostsMutation } from "../features/posts/postsApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, Upload, FileText, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Progress } from "../components/ui/progress";

const BulkUpload = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [bulkCreate, { isLoading }] = useBulkCreateScheduledPostsMutation();
    const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
    const [report, setReport] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                toast.error("Please upload a CSV file");
                return;
            }
            setFile(selectedFile);
            setUploadStatus("idle");
            setReport(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadStatus("uploading");
            const response = await bulkCreate(formData).unwrap();

            setReport(response.data);
            setUploadStatus("success");

            if (response.data.failed === 0) {
                toast.success(`Successfully scheduled ${response.data.successful} posts!`);
                // Optional: Redirect after delay
                // setTimeout(() => navigate("/dashboard/scheduler"), 2000);
            } else {
                toast.warning(`Processed with errors: ${response.data.successful} success, ${response.data.failed} failed`);
            }
        } catch (error) {
            console.error("Bulk upload failed:", error);
            setUploadStatus("error");

            if (error.data?.data) { // If server returns report in error
                setReport(error.data.data);
            } else {
                toast.error(error.data?.message || "Failed to upload file");
            }
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Bulk Scheduling</h1>
            <p className="text-muted-foreground">Upload a CSV file to schedule multiple posts at once.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload CSV</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                <div className="p-4 rounded-full bg-primary/10 text-primary">
                                    <Upload className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold">Click to upload or drag and drop</h3>
                                    <p className="text-sm text-muted-foreground">CSV files only (Max 5MB)</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".csv"
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {file && (
                                <div className="flex items-center p-3 bg-muted rounded-md gap-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Remove</Button>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    className="w-full"
                                    onClick={handleUpload}
                                    disabled={!file || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processsing...
                                        </>
                                    ) : (
                                        "Import Posts"
                                    )}
                                </Button>
                            </div>

                            <div className="text-xs text-muted-foreground mt-4">
                                <p><strong>CSV Format:</strong></p>
                                <code className="block bg-muted p-2 rounded mt-1">
                                    platform,caption,date,time,mediaUrl<br />
                                    twitter,"Hello World",2024-12-25,10:00,
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Section */}
                <div className="space-y-6">
                    {uploadStatus === "idle" && !report && (
                        <Card className="h-full flex items-center justify-center border-dashed bg-muted/20">
                            <CardContent className="text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Upload a file to see the validation report here.</p>
                            </CardContent>
                        </Card>
                    )}

                    {report && (
                        <Card className={uploadStatus === "error" ? "border-red-200 bg-red-50/10" : "border-green-200 bg-green-50/10"}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {uploadStatus === "success" && report.failed === 0 ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    )}
                                    Import Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        <div className="text-2xl font-bold">{report.totalProcessed}</div>
                                        <div className="text-xs text-muted-foreground uppercase">Total</div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-green-500">
                                        <div className="text-2xl font-bold text-green-600">{report.successful}</div>
                                        <div className="text-xs text-muted-foreground uppercase">Success</div>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-red-500">
                                        <div className="text-2xl font-bold text-red-600">{report.failed}</div>
                                        <div className="text-xs text-muted-foreground uppercase">Failed</div>
                                    </div>
                                </div>

                                {report.errors && report.errors.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" /> Errors & Warnings
                                        </h4>
                                        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto p-2 space-y-2">
                                            {report.errors.map((err, idx) => (
                                                <div key={idx} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-900/30 flex gap-2">
                                                    <span className="font-bold text-red-600 whitespace-nowrap">Row {err.row || err.error?.row}:</span>
                                                    <span className="text-gray-700 dark:text-gray-300">{err.message || err.error?.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {uploadStatus === "success" && (
                                    <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/scheduler")}>
                                        View Schedule
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUpload;
