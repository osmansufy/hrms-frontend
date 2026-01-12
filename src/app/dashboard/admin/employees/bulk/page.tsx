"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Papa, { ParseResult } from "papaparse";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, FileText, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

// Types
interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BulkCreateResult {
  successful: any[];
  failed: Array<{ row: number; email: string; error: string }>;
  total: number;
}

// Validation enums
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY", "CONSULTANT"];
const GENDERS = ["MALE", "FEMALE"];
const MARITAL_STATUSES = ["SINGLE", "MARRIED"];

export default function BulkCreateEmployeesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [results, setResults] = useState<BulkCreateResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);

  // React Query mutation for bulk upload
  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<BulkCreateResult>("/employees/bulk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    },
    onSuccess: (result) => {
      setResults(result);

      if (result.failed.length === 0) {
        toast.success("Upload successful!", {
          description: `All ${result.successful.length} employees created successfully.`,
        });
      } else {
        toast.warning("Partial success", {
          description: `${result.successful.length} succeeded, ${result.failed.length} failed.`,
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred.";
      toast.error("Upload failed", {
        description: errorMessage,
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setValidationErrors([]);
      setParsedData([]);
    }
  };

  const validateCSVData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const emails = new Set<string>();

    // Required fields
    const requiredFields = [
      "email",
      "password",
      "firstName",
      "lastName",
      "gender",
      "employmentType",
    ];

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because row 1 is headers, arrays are 0-indexed

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].trim() === "") {
          errors.push({
            row: rowNum,
            field,
            message: `Missing required field: ${field}`,
          });
        }
      });

      // Validate email format
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({
            row: rowNum,
            field: "email",
            message: "Invalid email format",
          });
        }

        // Check for duplicate emails in CSV
        if (emails.has(row.email.toLowerCase())) {
          errors.push({
            row: rowNum,
            field: "email",
            message: `Duplicate email found: ${row.email}`,
          });
        }
        emails.add(row.email.toLowerCase());
      }

      // Validate password length
      if (row.password && row.password.length < 6) {
        errors.push({
          row: rowNum,
          field: "password",
          message: "Password must be at least 6 characters",
        });
      }

      // Validate employment type
      if (row.employmentType && !EMPLOYMENT_TYPES.includes(row.employmentType)) {
        errors.push({
          row: rowNum,
          field: "employmentType",
          message: `Invalid employment type. Must be one of: ${EMPLOYMENT_TYPES.join(", ")}`,
        });
      }

      // Validate gender
      if (row.gender && !GENDERS.includes(row.gender)) {
        errors.push({
          row: rowNum,
          field: "gender",
          message: `Invalid gender. Must be one of: ${GENDERS.join(", ")}`,
        });
      }

      // Validate marital status (optional field)
      if (row.maritalStatus && !MARITAL_STATUSES.includes(row.maritalStatus)) {
        errors.push({
          row: rowNum,
          field: "maritalStatus",
          message: `Invalid marital status. Must be one of: ${MARITAL_STATUSES.join(", ")}`,
        });
      }

      // Validate date format (YYYY-MM-DD) - only if provided
      if (row.joiningDate && row.joiningDate.trim() !== "") {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.joiningDate)) {
          errors.push({
            row: rowNum,
            field: "joiningDate",
            message: "Invalid date format. Use YYYY-MM-DD",
          });
        }
      }

      // Validate phone format (basic) - only if provided
      if (row.phone && row.phone.trim() !== "" && row.phone.length < 10) {
        errors.push({
          row: rowNum,
          field: "phone",
          message: "Phone number must be at least 10 digits",
        });
      }
    });

    return errors;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("No file selected", {
        description: "Please select a CSV file to upload.",
      });
      return;
    }

    setResults(null);
    setValidationErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResult: ParseResult<any>) => {
        try {
          const data = parseResult.data as any[];

          if (data.length === 0) {
            toast.error("Empty CSV file", {
              description: "The CSV file contains no data rows.",
            });
            return;
          }

          if (data.length > 100) {
            toast.error("Too many rows", {
              description: "Bulk upload is limited to 100 employees per file.",
            });
            return;
          }

          setParsedData(data);

          // Validate CSV data
          const errors = validateCSVData(data);
          if (errors.length > 0) {
            setValidationErrors(errors);
            toast.error("Validation failed", {
              description: `Found ${errors.length} validation error(s). Please fix them and try again.`,
            });
            return;
          }

          // Upload using React Query mutation
          bulkUploadMutation.mutate(file);
        } catch (error: any) {
          toast.error("Error processing CSV", {
            description: error.message || "An unknown error occurred.",
          });
        }
      },
      error: (error: any) => {
        toast.error("Error parsing CSV", {
          description: error.message,
        });
      },
    });
  };

  const downloadTemplate = () => {
    const template = `email,password,firstName,middleName,lastName,joiningDate,gender,phone,employmentType,departmentId,designationId,reportingManagerId,dateOfBirth,maritalStatus,bloodGroup,nationality,personalEmail,alternatePhone,confirmationDate,probationPeriod,noticePeriod,workScheduleId
john.doe@example.com,Password123,John,M,Doe,,MALE,,FULL_TIME,,,,,SINGLE,O+,US,john.personal@gmail.com,0987654321,2024-04-15,3,30,
jane.smith@example.com,SecurePass456,Jane,,Smith,2024-02-01,FEMALE,1234567891,PART_TIME,,,,,MARRIED,A+,UK,jane.personal@gmail.com,,2024-05-01,2,15,`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee_bulk_upload_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded", {
      description: "Use this template to format your employee data.",
    });
  };

  return (
    <div className="container space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Create Employees</h1>
          <p className="text-muted-foreground mt-2">
            Upload a CSV file to create multiple employees at once (max 100 per upload)
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            CSV Format Instructions
          </CardTitle>
          <CardDescription>
            Follow these guidelines for successful bulk upload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Required Fields:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>email (unique, valid format)</li>
              <li>password (minimum 6 characters)</li>
              <li>firstName, lastName</li>
              <li>gender (MALE, FEMALE, or OTHER)</li>
              <li>employmentType (FULL_TIME, PART_TIME, CONTRACT, INTERN, TEMPORARY, or CONSULTANT)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Optional Fields:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>joiningDate (format: YYYY-MM-DD, defaults to today)</li>
              <li>phone (minimum 10 digits if provided)</li>
              <li>middleName, dateOfBirth</li>
              <li>maritalStatus (SINGLE or MARRIED)</li>
              <li>bloodGroup, nationality, personalEmail, alternatePhone</li>
              <li>departmentId, designationId, reportingManagerId (UUIDs from system)</li>
              <li>confirmationDate, probationPeriod, noticePeriod, workScheduleId</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Select your CSV file and click upload. The file will be validated before processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={bulkUploadMutation.isPending}
              className="max-w-md"
            />
            <Button onClick={handleUpload} disabled={bulkUploadMutation.isPending || !file}>
              {bulkUploadMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>File Selected</AlertTitle>
              <AlertDescription>
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Validation Errors ({validationErrors.length})
            </CardTitle>
            <CardDescription>
              Please fix the following errors and try again
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationErrors.map((error, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell className="font-mono text-sm">{error.field}</TableCell>
                      <TableCell className="text-destructive">{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{results.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">
                  Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {results.successful.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-destructive">
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {results.failed.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Successful Employees */}
          {results.successful.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Successfully Created ({results.successful.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.successful.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-mono">{employee.employeeCode}</TableCell>
                          <TableCell>
                            {employee.firstName} {employee.lastName}
                          </TableCell>
                          <TableCell>{employee.user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600">
                              {employee.user.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed Employees */}
          {results.failed.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Failed to Create ({results.failed.length})
                </CardTitle>
                <CardDescription>
                  These employees could not be created. Review errors and try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.failed.map((failure, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{failure.row}</TableCell>
                          <TableCell className="font-mono">{failure.email}</TableCell>
                          <TableCell className="text-destructive">{failure.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
