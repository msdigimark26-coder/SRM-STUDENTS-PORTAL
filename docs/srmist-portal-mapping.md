# SRMIST Portal Mapping Discovery

## Status: Discovery Completed (Phase 5A)

### Overview
Following successful manual authentication, the Playwright session successfully captured the dashboard DOM. 
The portal uses a form-based internal navigation system (a single-page application style utilizing `POST` requests to `HRDSystem.jsp`) instead of standard `href` links.

### Portal Structure Findings

#### 1. Dashboard (Student Profile)
- **URL**: `https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/UserHomePage.jsp`
- **Navigation Mechanism**: 
  - Standard `<a>` tags with `href` are **not** used. 
  - Links trigger a JavaScript function: `onclick="funSetFormId(arg)"`
  - This function sets a hidden field `$("#hdnFormId").val(arg)` and submits the `#userHomePage` form to `../../students/template/HRDSystem.jsp`.
- **Target Pages**:
  - **Attendance Details**: Requires triggering `funSetFormId(9)` or clicking the element with `id="listId9"`.

#### 2. Mapped Fields (Dashboard)
The dashboard contains a "Student Profile" table. 

**Student Name**:
- **DOM Relationship**: Inside a `<tr>` where the first `<td>` contains the text "Student Name".
- **Selector Strategy**: Find `td` containing "Student Name", then traverse to the next `td`'s child `div` containing the text.
- **Example class**: `font-weight-bold font-weight-700 text-custom`

**Student ID**:
- **DOM Relationship**: Inside a `<tr>` where the first `<td>` contains the text "Student ID".
- **Selector Strategy**: Find `td` containing "Student ID", then traverse to the next `td`'s child `div`.

#### 3. Unmapped Fields (Requires Phase 5B Navigation)
Because the "Attendance Details" and "Course List" pages are hidden behind POST requests that were not triggered during this passive discovery phase, the following fields remain to be mapped during the active scraping implementation in Phase 5B:
- Current semester / Academic year
- Subject code, name, credits
- Attended hours, Conducted hours, Attendance percentage
- Timetable / Class period

### Proposed Selector & Scraper Strategy for Phase 5B
Since the application relies heavily on jQuery and form submissions, our scraper in Phase 5B should:
1. Wait for the dashboard to load.
2. Extract the base student details (Name, ID) from the dashboard.
3. Simulate clicking the "Attendance Details" menu item (`await page.click('#listId9')`) and wait for the network to idle as it submits the POST request.
4. Parse the resulting Attendance Details DOM. 
5. Repeat for Timetable/Course List if they are on separate sub-pages.
