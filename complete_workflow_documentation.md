# COMPLETE INFRASTRUCTURE INSPECTION WORKFLOW
## From Folder Creation to Data Display

### **PHASE 1: PROJECT FOLDER CREATION**

#### 1.1 User Interface Entry Point
- **Location**: Upload page (`/upload`)
- **Action**: User clicks "Create New Folder" button
- **Modal**: Folder creation dialog opens

#### 1.2 Folder Data Collection
```typescript
// Data Required (NO synthetic data allowed)
{
  folderName: string,        // User-provided project name
  projectAddress: string,    // Real project location
  projectNumber: string      // Extracted from filename or user input
}
```

#### 1.3 Address Validation & Distance Calculation
- **File**: `shared/address-validation.ts`
- **Process**: Real-time address autocomplete using authentic UK address database
- **Distance**: Calculated from user's configured depot postcode to project address
- **NO hardcoded postcodes** - requires depot configuration first

#### 1.4 Database Storage
- **Table**: `projectFolders`
- **Fields**: `id`, `userId`, `folderName`, `projectAddress`, `projectNumber`, `createdAt`

---

### **PHASE 2: FILE UPLOAD PROCESS**

#### 2.1 File Selection & Validation
- **Location**: Upload page file input
- **Allowed**: PDF files only (up to 50MB)
- **Validation**: File type, size, and name extraction

#### 2.2 Project Number Extraction
```javascript
// From filename - server/routes.ts line 1084-1085
const projectMatch = req.file.originalname.match(/(\d{4})/);
const projectNo = projectMatch ? projectMatch[1] : "0000";
```
- **Pattern**: First 4 consecutive digits in filename
- **Fallback**: "0000" if no 4-digit pattern found
- **Examples**: 
  - `"1234 Client Project.pdf"` → `"1234"`
  - `"Report 5678.pdf"` → `"5678"`
  - `"Site Survey.pdf"` → `"0000"`

#### 2.3 Sector Selection
- **Required**: User must select infrastructure sector
- **Options**: Utilities, Adoption, Highways, Insurance, Construction, Domestic
- **Storage**: Linked to file upload record

#### 2.4 Database Storage
- **Table**: `fileUploads`
- **Fields**: `fileName`, `fileSize`, `filePath`, `projectNumber`, `sector`, `folderId`, `status`

---

### **PHASE 3: PDF PROCESSING & DATA EXTRACTION**

#### 3.1 PDF Parsing
- **Library**: `pdf-parse`
- **Process**: Convert PDF to raw text for analysis
- **Output**: Plain text content for pattern matching

#### 3.2 Section Data Extraction
**Critical Rule**: **ZERO TOLERANCE FOR SYNTHETIC DATA**

##### 3.2.1 Manhole Reference Extraction
```javascript
// Authentic extraction patterns - server/routes.ts
const manholePattern = /(\w+(?:-\w+)*)\s*(?:→|->|to)\s*(\w+(?:-\w+)*)/g;
```
- **Source**: Direct PDF content only
- **Examples**: `"F01-10A→F01-10"`, `"SW02→SW01"`, `"RE2→Main Run"`
- **NO fallback** to placeholder data

##### 3.2.2 Pipe Specifications
```javascript
// Extract pipe size, material, lengths
const specsPattern = /(\d+mm)\s+([A-Za-z\s]+)\s+(\d+\.?\d*m)/;
```
- **Fields**: `pipeSize`, `pipeMaterial`, `totalLength`, `lengthSurveyed`
- **Source**: Authentic PDF content only
- **Examples**: `"150mm Polyvinyl chloride 14.27m"`

##### 3.2.3 Defect Classification (MSCC5 Compliance)
- **File**: `server/mscc5-classifier.ts`
- **Process**: Parse observation codes and defects
- **Standards**: WRc MSCC5, SRM compliance
- **Output**: Grade 0-5 severity, structural vs service classification

#### 3.3 Inspection Direction Logic
```javascript
// Apply upstream/downstream flow direction rules
if (inspectionDirection === 'Upstream') {
  // Reverse flow direction for upstream inspections
} else {
  // Maintain normal flow for downstream inspections
}
```

#### 3.4 Database Storage
- **Table**: `sectionInspections`
- **Records**: One per section with authentic extracted data
- **Fields**: All manhole refs, pipe specs, defects, recommendations

---

### **PHASE 4: DASHBOARD DISPLAY**

#### 4.1 Data Retrieval
- **API**: `/api/uploads/:uploadId/sections`
- **Query**: Fetch all sections for selected report
- **Caching**: TanStack Query with proper invalidation

#### 4.2 Table Structure
```typescript
// Dashboard columns display
{
  itemNo: number,           // Section number (1, 2, 3...)
  startMH: string,          // Authentic manhole reference
  finishMH: string,         // Authentic manhole reference  
  pipeSize: string,         // Real pipe diameter
  pipeMaterial: string,     // Authentic material type
  totalLength: string,      // Extracted measurement
  defects: string,          // MSCC5 classified observations
  recommendations: string,  // WRc standards-based actions
  severityGrade: number,    // Grade 0-5
  adoptable: string,        // Yes/No/Conditional
  cost: string             // Calculated or "Configure"
}
```

#### 4.3 Real-Time Filtering
- **Filters**: Severity Grade, Adoptable Status, Pipe Size, Pipe Material
- **State**: Persisted in localStorage
- **Count**: Dynamic section count display

#### 4.4 Color Coding (MSCC5 Compliant)
- **Grade 0**: Green (adoptable) / Grey (non-adoptable)
- **Grade 1**: Red (structural defects)
- **Grade 2**: Amber (minor defects)
- **Grade 3-4**: Red (major defects)
- **Grade 5**: Green (observations only)

---

### **PHASE 5: CRITICAL DATA INTEGRITY CHECKPOINTS**

#### 5.1 Zero Synthetic Data Validation
- **Files Monitored**: All extraction functions
- **Prohibited**: Hardcoded manhole refs, fake measurements, placeholder defects
- **Required**: Authentic PDF source for ALL data points

#### 5.2 Comprehensive Audit System
- **Script**: `comprehensive_data_audit.sh`
- **Scans**: All source files for old project contamination
- **Patterns**: Old project numbers, manhole refs, defect data

#### 5.3 Flow Direction Verification
- **Rule**: Upstream inspections reverse flow direction
- **Example**: PDF shows "Upstream" → display downstream→upstream
- **Protection**: Inspection direction logic locked with modification warnings

---

### **PHASE 6: EXPORT & ANALYSIS**

#### 6.1 Excel Export
- **Format**: True .xlsx with proper formatting
- **Content**: All visible columns plus metadata
- **Filters**: Respects active dashboard filters
- **Headers**: Professional formatting with project details

#### 6.2 Cost Calculation Integration
- **Logic**: Service vs structural defect differentiation
- **Pricing**: Sector-specific repair cost configuration
- **Display**: "Complete" for Grade 0, "Configure" for pricing needed

---

## **WORKFLOW SUMMARY**

**Input**: User creates folder → uploads PDF → selects sector
**Processing**: Extract authentic data → classify defects → apply standards
**Output**: Dashboard displays real inspection data with MSCC5 compliance
**Export**: Professional reports with authentic data integrity maintained

**Zero Tolerance Policy**: No synthetic, placeholder, or fallback data at any stage of the workflow.