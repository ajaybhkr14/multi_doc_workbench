implementation rules
dont create readme unless asked and dont run test cases unnecessarily
pls add minimal logging also
create simple modular 
CODE SHOULD BE EASY TO READ AND TO REVIEW
use build/ src/ for js and ts both in frontend and backend
gen .env , .env.exapmle , gitignore
we will be using typescript, express,multer,knex, postgres
db logic should be in db and buisness logic in service etc

## IMPORTANT
MAKE CODE VERY SIMPLE AND EASIER TO READ
MULTIPLE FILE WILL BE UPLOADED AND PROCESSED INDEPENDENTLY
INSTRUCTIONS WILL BE GIVEN FROM UI 
CREATE 2 ROUTES DOCUMENTS(UPLOADING) AND ANALYSIS
MOST IMP - IF API KEY IS EMPTY IN .env THEN MOCK FLOW WILL BE USED
MOCK FLOW MUST PERFORM COMPARISIONS , EXTRACT FACTS, DISCREPENCY FOR NUMERIC THINGS LIKE FINANCIAL DATA, NAME , ADDRESS ETC
MOCK MODE SHOULD GENUINELY FUNCTIONAL NOT STATIC
Clear distinction between extracted facts and AI-generated interpretations.
CALCULATE DIFFERENCES IN TYPESCRIPT
EACH FINDING MUST INCLUDE EVIDENCE, DOC ID FILENAME ETC



Project Requirement

Project: Multi-Document Banking Intelligence Workbench

Build a full-stack application that allows banking users to upload multiple financial and supporting documents, provide an analysis instruction, and receive structured insights based on the uploaded documents.

The application should simulate real-world banking scenarios involving customer onboarding, loan processing, financial verification, and document validation.

3. Banking Use Cases

The application should support scenarios such as:

A. KYC Document Verification

Compare customer details across PAN, Aadhaar, and application forms.
Identify mismatches in customer names, addresses, and dates of birth.
Highlight missing KYC information.
Identify inconsistencies between submitted documents.
B. Loan Application Assessment

Compare loan application details with supporting documents.
Extract applicant income, employment details, and requested loan amounts.
Identify discrepancies between declared and verified income.
Highlight missing supporting documents.
C. Bank Statement Analysis

Extract account balances, transaction amounts, and transaction dates.
Identify unusual differences in reported financial figures.
Compare income details against salary slips and bank statements.
Generate a consolidated financial summary.
D. Financial Document Comparison

Compare financial statements from multiple companies.
Extract revenue, liabilities, assets, and outstanding loan amounts.
Highlight inconsistencies in financial figures.
Identify missing financial information.
