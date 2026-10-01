/**
 * ============================================================================
 * SINGLE FILE FOR STUDENT DETAILS CONFIGURATION
 * ============================================================================
 * You can directly enter your real student details in this file.
 * Replace the empty string values below with your actual information.
 * ============================================================================
 */

export interface StudentProfile {
  name: string;
  department: string;
  year: string;
  mobileNumber: string;
}

/**
 * Primary student details.
 * Enter your actual details here:
 */
export const studentDetails: StudentProfile = {
  name: "",
  department: "",
  year: "",
  mobileNumber: ""
};

/**
 * If multiple students are supported, you can configure them here:
 */
export const students: StudentProfile[] = [
  {
    name: "",
    department: "",
    year: "",
    mobileNumber: ""
  }
];
