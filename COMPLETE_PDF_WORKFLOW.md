# Complete PDF Processing Workflow

## Overview
This document demonstrates the complete workflow for processing PDF inspection reports from upload to dashboard display.

## Workflow Steps

### Step 1: File Upload & Storage
- User uploads PDF file through `/upload` page
- File saved to `uploads/` directory 
- Database record created in `file_uploads` table
- Upload status set to 'processing'

### Step 2: PDF Content Extraction
- PDF parsed using `pdf-parse` library
- Text content extracted from all pages
- Raw text analyzed for section patterns
- Project information extracted from header

### Step 3: Section Data Parsing
For each section (1-95):
- **Manhole References**: Extract start/finish MH from "F01-10A > F01-10" patterns
- **Pipe Specifications**: Extract size (150mm), material (Vitrified clay), lengths (14.27m)
- **Inspection Data**: Extract date (14/02/25), time (11:22), direction (downstream)
- **Defect Analysis**: Apply MSCC5 classification system
- **Flow Direction**: Apply inspection direction logic (upstream/downstream)

### Step 4: MSCC5 Classification
- Analyze defect codes (DER, FC, CR, JDL, etc.)
- Apply severity grading (Grade 0-5)
- Generate recommendations per WRc standards
- Determine adoptability status (Yes/No/Conditional)

### Step 5: Database Storage
Sections stored in `section_inspections` table with fields:
- `id`: Auto-generated primary key
- `file_upload_id`: Links to upload record
- `item_no`: Section number (1-95)
- `start_mh`, `finish_mh`: Manhole references  
- `pipe_size`, `pipe_material`: Specifications
- `total_length`, `length_surveyed`: Measurements
- `defects`: Defect descriptions
- `recommendations`: MSCC5 recommendations
- `severity_grade`: Grade 0-5
- `adoptable`: Yes/No/Conditional
- `date`, `time`: Inspection metadata

### Step 6: Dashboard Display
- Frontend queries `/api/uploads/{id}/sections` endpoint
- Sections displayed in sortable/filterable table
- Color coding applied based on severity grade
- Repair/cleaning options available for defective sections
- Export functionality for Excel/CSV reports

## Data Flow Example - First 10 Sections

```
Section 1: F01-10A → F01-10, 150mm Vitrified clay, 14.27m, Grade 0, Adoptable: Yes
Section 2: F02-03 → F02-04, 150mm Vitrified clay, 12.50m, Grade 0, Adoptable: Yes  
Section 3: F03-05 → F03-06, 225mm Concrete, 18.75m, Grade 3, Adoptable: No (DER debris)
...
```

## Quality Assurance
- Zero tolerance for synthetic data
- All data extracted from authentic PDF content
- MSCC5 compliance verification
- Flow direction validation
- Inspection methodology compliance

## Technical Implementation
- **Backend**: Express.js with TypeScript
- **PDF Parser**: pdf-parse library
- **Database**: PostgreSQL with Drizzle ORM
- **Classification**: Custom MSCC5 engine
- **Frontend**: React with TanStack Query
- **Standards**: WRc, OS20x, BS EN compliance