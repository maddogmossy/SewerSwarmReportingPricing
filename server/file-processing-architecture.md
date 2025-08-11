# File Processing Architecture Documentation

## Overview
This system processes sewer inspection reports in multiple formats while maintaining data integrity and consistent analysis results. The architecture supports paired database files (.db3 + Meta.db3) and standalone PDF reports.

## Supported File Formats

### 1. Database File Pairs (.db3 + Meta.db3)
**Primary Format**: Wincan inspection database files
- **Main Database (.db3)**: Contains section inspection data, defects, pipe information
- **Meta Database (Meta.db3)**: Contains project metadata, equipment settings, calibration data
- **Processing**: Both files required for complete analysis and accurate grading
- **Validation**: System validates file pairing and warns when Meta file is missing

### 2. PDF Reports (Future Support)
**Secondary Format**: Generated reports containing same data structure as database files
- **Processing**: Single file contains all inspection data in structured format
- **Validation**: PDF parsing will extract sections, defects, and metadata
- **Consistency**: Same analysis logic applied as database files

## File Pairing Validation System

### Upload Validation
- **Real-time Checking**: Validates file pairs during upload process
- **Warning System**: Displays warnings when Meta.db3 files are missing
- **Status Tracking**: Monitors pairing completeness per project

### Processing Logic
```typescript
// File pairing validation flow
1. File Upload → Check for existing companion file
2. If Main.db3 uploaded → Check for existing Meta.db3
3. If Meta.db3 uploaded → Check for existing Main.db3
4. Display appropriate warnings for incomplete pairs
5. Process available files with quality indicators
```

### Dashboard Display
- **File Contents**: Shows all files per report with type indicators
- **Pairing Status**: Visual indicators for complete/incomplete pairs
- **Warning Display**: Red triangle warnings for missing Meta files

## Processing Pipeline

### Stage 1: File Validation
- File type verification (.db3, Meta.db3, .pdf)
- Project number extraction
- Companion file detection
- Size and integrity checks

### Stage 2: Data Extraction
- **Database Files**: SQLite parsing for sections, defects, pipe data
- **PDF Files**: Text parsing with pattern matching for same data structure
- **Metadata Extraction**: Project info, equipment settings, standards

### Stage 3: Standardization
- **Uniform Schema**: All formats converted to common section inspection schema
- **Defect Classification**: MSCC5 standard application regardless of source format
- **Quality Indicators**: Completeness scoring based on available data

### Stage 4: Analysis
- **Severity Grading**: WRc MSCC5 + OS20X standards
- **Service/Structural Classification**: Consistent across all file types
- **Cost Calculations**: Same pricing logic for all sources

## Implementation Status

### ✅ Completed Features
- Database file upload and processing
- File pairing validation system
- Warning display for missing Meta files
- Dashboard file contents display
- Authentic data extraction from .db3 files

### 🔄 In Progress
- Enhanced pairing validation with user notifications
- File processing architecture documentation
- Error handling for corrupted files

### 📋 Planned Features
- PDF report parsing and processing
- Unified processing pipeline for all formats
- Advanced metadata utilization
- Cross-format consistency validation

## Quality Assurance

### Data Integrity Rules
1. **No Synthetic Data**: Only authentic data from source files
2. **Consistent Processing**: Same analysis logic regardless of file type
3. **Complete Validation**: Full file pairing verification
4. **Error Transparency**: Clear warnings for incomplete data

### User Experience
- **Clear File Status**: Visual indicators for pairing completeness
- **Processing Feedback**: Real-time status updates during file processing
- **Quality Warnings**: Proactive alerts for potential data completeness issues
- **Recovery Options**: Guidance for resolving file pairing issues

## Technical Architecture

### File Storage
- **Upload Directory**: Temporary storage for processing
- **Database Records**: File metadata and relationships
- **Processing Queue**: Asynchronous file processing pipeline

### Validation Components
- `FilePairingValidator`: Checks file relationships and completeness
- `Db3Validator`: Validates database file integrity
- `FileContentsDisplay`: UI component for showing file pairs

### Processing Components
- `WincanDbReader`: Extracts data from database files  
- `PdfProcessor`: (Future) Extracts data from PDF reports
- `DataStandardizer`: Converts all formats to common schema
- `MSCC5Classifier`: Applies standard defect classification