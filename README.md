# LIBRIX — Smart Library Catalog Management System

> **Academic Coursework Mini-Project**: Second-Year Information Technology (B.Tech / B.E.)  
> **Topic**: Library Catalog Management System Using Singly Linked List for Inserting, Deleting, and Searching Books by ISBN.

---

## 1. Project Introduction

**LIBRIX** is a full-stack, enterprise-grade Library Catalog Management System built to demonstrate the practical application of fundamental data structures in software engineering. 

Unlike conventional applications that rely on databases or high-level array abstractions, **LIBRIX utilizes a custom Singly Linked List (SLL) in Python as its primary in-memory data store**. Every core operation—including book insertion, deletion, ISBN-based searching, checkouts, and returns—directly traverses and manipulates node pointers (`self.head` and `node.next`).

### Core Architectural Principles
- **In-Memory Singly Linked List**: The authoritative state of the catalog resides in linked list nodes.
- **Atomic Persistence**: On every mutation, the linked list is serialized to JSON (`backend/data/books.json`) using atomic replacement (`tempfile` + `os.replace`) to guarantee zero corruption.
- **Thread Safety**: All linked list mutations and file I/O are synchronized using Python's `threading.RLock()`.
- **Interactive Visualizer**: A visual trace of pointer traversal (`HEAD -> NODE -> ... -> NULL`) designed for practical examination demonstrations and viva evaluations.

---

## 2. Technologies Used

### Frontend
- **React 18** with **Vite** — Fast, reactive Single Page Application (SPA).
- **Tailwind CSS** — Bespoke enterprise SaaS styling (Linear & Notion inspired).
- **Lucide React** — Modern, accessible SVG iconography.
- **Framer Motion** — Smooth page transitions and interactive node animations.
- **Recharts** — Dynamic SVG charts for real-time catalog analytics.
- **React Router DOM v6** — Client-side SPA routing across 8 dedicated views.
- **Axios** — HTTP client communicating with backend REST endpoints.
- **Sonner** — Polished, accessible toast notification stack.

### Backend
- **Python 3.10+ / 3.14**
- **FastAPI** — High-performance asynchronous REST API framework.
- **Uvicorn** — Lightning-fast ASGI production web server.
- **Pydantic v2** — Rigorous request validation, ISBN format checking, and schema modeling.
- **Pytest** & **HTTPX** — Automated unit and API integration testing suite.

---

## 3. Singly Linked List Data Structure Implementation

### The Node: `BookNode`
Each node in the catalog represents an individual book entity containing bibliographic metadata and a reference pointer to its successor:
```text
+--------------------------------------------------------------------------------+
|                                   BookNode                                     |
+--------------------------------------------------------------------------------+
| - isbn: str                     (Unique key, e.g. 9780262033848)               |
| - title: str                    (e.g. "Introduction to Algorithms")            |
| - author: str                   (e.g. "Thomas H. Cormen et al.")               |
| - category: str                 (e.g. "Data Structures")                       |
| - publication_year: int         (e.g. 2009)                                    |
| - publisher: str                (e.g. "MIT Press")                             |
| - availability_status: str      ("Available" | "Issued")                       |
| - issued_to: str                (Student name if issued, else "")              |
| - next: Optional[BookNode]      (Pointer reference to next node or None)       |
+--------------------------------------------------------------------------------+
```

### The Linked List: `LibraryLinkedList`
The list maintains a single reference pointer: `self.head`.

```text
       HEAD
        │
        ▼
   +----------+        +----------+        +----------+
   |  NODE 0  |  --->  |  NODE 1  |  --->  |  NODE 2  |  --->  NULL
   |  (CLRS)  |        | (Clean)  |        | (Prag)   |
   +----------+        +----------+        +----------+
```

### Pointer Traversal Algorithms

#### 1. Insertion at End (`insert_book`)
1. Validate ISBN checksum (ISBN-10 or ISBN-13).
2. Traverse list from `self.head` to verify uniqueness (prevent duplicates).
3. If `self.head is None`, set `self.head = new_node`.
4. Else, traverse using `while current.next is not None: current = current.next`.
5. Wire pointer: `current.next = new_node`.
6. Atomically persist updated list to JSON.

#### 2. Deletion by ISBN (`delete_book`)
1. If list is empty (`self.head is None`), raise `KeyError`.
2. **Head Node Deletion**: If `self.head.isbn == isbn`:
   - Check if book is issued; if yes, refuse deletion until returned.
   - Re-wire head: `self.head = self.head.next`.
3. **Middle / Tail Node Deletion**:
   - Maintain two pointers: `prev` and `current`.
   - Traverse: `while current is not None and current.isbn != isbn: prev = current; current = current.next`.
   - If `current is None`, ISBN does not exist.
   - If `current.availability_status == "Issued"`, refuse deletion.
   - Unlink node: `prev.next = current.next`.

#### 3. Searching by ISBN (`search_book`)
1. Initialize `current = self.head` and `steps = 0`.
2. While `current is not None`:
   - Increment `steps += 1`.
   - Compare `if current.isbn == isbn`: return `(current, steps, path)`.
   - Advance: `current = current.next`.
3. If loop finishes without match, return `(None, steps, path)`.

---

## 4. Algorithmic Time & Space Complexity

| Operation | Algorithm | Time Complexity | Space Complexity |
| :--- | :--- | :---: | :---: |
| **Insert at End** | Linear traversal to tail | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ |
| **Search by ISBN** | Linear pointer traversal | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ |
| **Delete by ISBN** | Linear search + pointer rewire | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ |
| **Display All Books** | Full list traversal | $\mathcal{O}(n)$ | $\mathcal{O}(n)$ |
| **Count Nodes** | Traversal counter | $\mathcal{O}(n)$ | $\mathcal{O}(1)$ |
| **Overall Catalog Storage** | In-memory node chain | — | $\mathcal{O}(n)$ |

---

## 5. Project Folder Structure

```text
library-management-system/
├── backend/
│   ├── main.py                  # FastAPI server, REST API endpoints, CORS
│   ├── linked_list.py           # BookNode & LibraryLinkedList implementations
│   ├── models.py                # Pydantic schemas (BookCreate, BookResponse, etc.)
│   ├── storage.py               # Atomic JSON persistence & RLock concurrency
│   ├── requirements.txt         # Python dependencies
│   ├── data/
│   │   ├── books.json           # Persistent library records
│   │   └── activities.json      # Real-time operation activity logs
│   └── tests/
│       ├── test_linked_list.py  # Unit tests for Singly Linked List edge cases
│       └── test_api.py          # Integration tests for FastAPI endpoints
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Fixed desktop & collapsible mobile navigation
│   │   │   ├── Navbar.jsx       # Top navigation, search shortcut, theme toggle
│   │   │   ├── StatCard.jsx     # Dashboard KPI card components
│   │   │   ├── Badge.jsx        # Status & Category badges
│   │   │   ├── BookModal.jsx    # Specification viewer & in-place node editor
│   │   │   ├── DeleteConfirmModal.jsx # Deletion confirmation safety modal
│   │   │   ├── EmptyState.jsx   # Empty catalog illustration & call-to-actions
│   │   │   └── Skeleton.jsx     # Pulse loading skeletons
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx   # Overview statistics & Recharts distribution
│   │   │   ├── CatalogPage.jsx     # Data table with filtering, search, pagination
│   │   │   ├── AddBookPage.jsx     # SLL node append form with ISBN checksum
│   │   │   ├── SearchPage.jsx      # Traversal search with verification trace
│   │   │   ├── IssueReturnPage.jsx # Student checkout & check-in management
│   │   │   ├── VisualizerPage.jsx  # Interactive SLL pointer traversal simulation
│   │   │   ├── ReportsPage.jsx     # Analytics, loan ratios & CSV catalog export
│   │   │   └── SettingsPage.jsx    # Themes, SLL health stats & database reset
│   │   ├── context/
│   │   │   └── ThemeContext.jsx    # Persistent light/dark theme provider
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios client & error handler
│   │   ├── App.jsx                 # Routing configuration & application layout
│   │   ├── index.css               # Tailwind CSS & custom scrollbar directives
│   │   └── main.jsx                # React DOM root entry
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── README.md
└── .gitignore
```

---

## 6. Installation & Setup Instructions

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (LTS recommended)
- **Git**

### Clone / Navigate to Project Directory
```powershell
cd "c:\Users\Mohit Vinayak Patil\Downloads\library managment system"
```

---

## 7. How to Run the Backend

1. **Install Python Dependencies**:
   ```powershell
   python -m pip install -r backend/requirements.txt
   ```

2. **Start the FastAPI Backend Server**:
   ```powershell
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Backend URLs**:
   - Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Alternative Redoc API Documentation: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 8. How to Run the Frontend

1. **Navigate to `frontend/`**:
   ```powershell
   cd frontend
   ```

2. **Install Dependencies** (if not already installed):
   ```powershell
   npm install
   ```

3. **Start the Vite Development Server**:
   ```powershell
   npm run dev
   ```

4. **Access the Application**:
   - Open your web browser at: [http://localhost:5173](http://localhost:5173)

---

## 9. REST API Endpoint Reference

| HTTP Method | Route | Description | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/books` | Returns all books in linked list order with presentation filters | `200 OK` |
| `POST` | `/api/books` | Validates ISBN, creates `BookNode`, appends to list, saves to JSON | `201 Created` |
| `GET` | `/api/books/{isbn}` | Searches for single book node by ISBN traversal | `200 OK` / `404` |
| `PUT` | `/api/books/{isbn}` | Updates metadata of an existing linked list node | `200 OK` / `404` |
| `DELETE` | `/api/books/{isbn}` | Unlinks node from SLL (prevents deletion if currently issued) | `200 OK` / `400` |
| `GET` | `/api/books/search` | Performs SLL traversal search (returns path steps for ISBN) | `200 OK` |
| `POST` | `/api/books/{isbn}/issue` | Issues book to student, sets status='Issued', saves borrower | `200 OK` / `400` |
| `POST` | `/api/books/{isbn}/return` | Returns book, resets status='Available', clears borrower | `200 OK` / `400` |
| `GET` | `/api/dashboard/stats` | Computes live catalog stats directly from list traversal | `200 OK` |
| `GET` | `/api/linked-list/visualize` | Exports complete node chain with pointers for visualizer | `200 OK` |
| `GET` | `/api/reports` | Returns category distributions, loan percentages, and author metrics | `200 OK` |
| `GET` | `/api/books/export` | Generates and streams standard downloadable catalog CSV | `200 OK` |
| `POST` | `/api/system/reset` | Resets catalog to default academic seed textbooks | `200 OK` |

---

## 10. Automated Testing Instructions

The project includes an automated test suite executed with `pytest`, covering all 21 test scenarios specified in the requirements:

```powershell
# Run the complete test suite from project root:
python -m pytest backend/tests/ -v
```

### Verified Test Scenarios:
1. `test_isbn_validation`: Verifies ISBN-10 and ISBN-13 checksum algorithms.
2. `test_insert_book`: Appends new nodes to empty and existing linked lists.
3. `test_prevent_duplicate_isbn`: Rejects duplicate ISBN insertion.
4. `test_search_existing_isbn`: Locates nodes and validates step counter.
5. `test_search_nonexistent_isbn`: Handles missing keys without errors.
6. `test_delete_head_node`: Correctly rewires `self.head` to `self.head.next`.
7. `test_delete_middle_node`: Correctly bridges predecessor and successor pointers.
8. `test_delete_last_node`: Re-wires tail predecessor's `next` pointer to `None`.
9. `test_delete_from_empty_list`: Gracefully raises `KeyError`.
10. `test_update_book`: Mutates node attributes while preserving node key.
11. `test_issue_and_return_book`: Enforces loan transitions and prevents duplicate issues.
12. `test_prevent_deletion_of_issued_book`: Blocks node unlinking when status is 'Issued'.
13. `test_visualization_structure`: Validates HEAD, TAIL, and `next_isbn` properties.
14. `test_persistence_reload`: Verifies data integrity across simulated application restarts.
15. `test_api_dashboard_stats`: Confirms accurate math computed dynamically from list.
16. `test_api_export_csv`: Validates CSV headers and mime type.

---

## 11. Practical Examination & Viva Questions

### Q1: Why use a Singly Linked List instead of a standard Array/Python list?
**Answer**: In a Singly Linked List, memory allocation is dynamic and non-contiguous. Nodes are linked via reference pointers (`self.next`). Insertion at the head is $\mathcal{O}(1)$ without shifting subsequent elements, whereas in an array, inserting or deleting at index 0 requires shifting all $n$ subsequent elements ($\mathcal{O}(n)$ data movement). In LIBRIX, every operation strictly adheres to explicit pointer manipulation to demonstrate low-level computer science data structure mechanics.

### Q2: How does deletion handle the Head vs Middle vs Tail node?
**Answer**:
- **Head Node**: If `self.head.isbn == target_isbn`, we re-assign the list head pointer: `self.head = self.head.next`.
- **Middle/Tail Node**: We maintain two pointers (`prev` and `current`) during while-loop traversal. When `current.isbn == target_isbn`, we bypass the target node by pointing `prev.next = current.next`. For the tail node, `current.next` is `None`, so `prev.next` becomes `None`, successfully terminating the list.

### Q3: How is data persistence handled without violating the data structure requirement?
**Answer**: The Singly Linked List remains the primary in-memory source of truth during runtime. JSON storage is only used as an external backup mechanism. Whenever the list is mutated (insert, delete, issue, return), the list is traversed from `self.head` to serialize the current node order and written atomically (`tempfile` + `os.replace`) to disk. On startup, the JSON file is parsed to reconstruct the exact linked list node-by-node.

---

**Developed for Practical Mini-Project Demonstration • Information Technology**
