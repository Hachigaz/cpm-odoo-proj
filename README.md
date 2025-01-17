# cpm-odoo-proj
## Overview
An Odoo's construction projects managements module that manages multiple projects with features such as planning, managing work assignments, finance, risks and issues, documents and contracts, view and manage assigned works, work quality management, stocks, and more.

## Features
- Create and manage multiple construction projects.
- Create project workflows, tasks for each workflows, assign task members and contractors, attach documents.
- View and manage records of project's investments and expenses.
- View, manage and download versions of project's documents and contracts.
- View, manage and resolve project's risks and issues.
- View and manage assigned tasks.
- Manage, process and evaluate completed tasks.
- Manage project stakeholders such as investors, contractors, suppliers nad other contacts.
- Create and manage warehouses, view each assigned warehouse stocks, manage warehouse's imports and exports.

## Installation
### Installation Steps
- Clone or download the repository.
- Install Docker.
- Install Odoo and PostgreSQL images in Docker.
- Use Docker's terminal and run the Docker Compose file compose.yaml.
- On the web browser, connect to localhost:8069 to access the Odoo's web server.
- Create new database and login to the database.
- Go to the "App" section in the menu and search for the "Construction Project Management" module.
- Activate and assign the current user permission to create projects to start creating projects.

## Previews
##### Project Management Features
- [Workflow Management](#workflow-management)
- [Task Management](#task-management)
- [Document Management](#document-management)
- [Contract Management](#contract-management)
- [Finance Management](#finance-management)
- [Task Evaluation Management](#task-evaluation-management)

##### Assigned Work Management
- [Assigned Work Overview](#assigned-work-overview)
- [Assigned Task Details](#assigned-task-details)

##### Resources Management
- [Assigned Warehouses Menu](#assigned-warehouses-menu)
- [Warehouse Management](#warehouse-management)

### Project Management
##### Assigned Projects View
![alt text](readme/img/assigned_projects.png)
##### Project Overview
![alt text](readme/img/project_overview.png)

#### Workflow Management
##### Overview
![alt text](readme/img/workflow_overview.png)
##### Manage Workflow
![alt text](readme/img/manage_workflow.png)
##### Workflow Tasks
![alt text](readme/img/workflow_tasks.png)
##### Workflow Schedule
![alt text](readme/img/workflow_schedule.png)

#### Task Management
##### Assigned Staffs
![alt text](readme/img/task_assigned_staffs.png)
##### Assigned Contractors
![alt text](readme/img/task_assigned_contractors.png)
##### Attached Documents
![alt text](readme/img/task_attached_documents.png)
##### Task Expenses
![alt text](readme/img/task_expense.png)

#### Document Management
##### Document Lists
![alt text](readme/img/document_list.png)
##### Document Details
![alt text](readme/img/document_details.png)

#### Contract Management
##### Contract Lists
![alt text](readme/img/contract_list.png)
##### Contract Details
![alt text](readme/img/contract_details.png)

#### Finance Management
##### Overview 
![alt text](readme/img/finance_overview_1.png)
![alt text](readme/img/finance_overview_2.png)
##### Budgets Tab
![alt text](readme/img/finance_budgets_tab.png)

#### Task Evaluation Management
##### Active Tasks 
![alt text](readme/img/task_qa_active.png)
##### Pending Tasks 
![alt text](readme/img/task_qa_pending.png)
##### Verified Tasks 
![alt text](readme/img/task_qa_verified.png)


### Assigned Work Management
#### Assigned Work Overview 
##### Active Tasks
![alt text](readme/img/assigned_work_overview.png)
##### Completed Tasks
![alt text](readme/img/completed_tasks.png)

#### Assigned Task Details
##### Task Checklists
![alt text](readme/img/assigned_work_checklist.png)
##### Document Attachments
![alt text](readme/img/assigned_work_doc_attachs.png)
##### Comments
![alt text](readme/img/assigned_work_comments.png)
##### Recent Notes
![alt text](readme/img/assigned_work_notes.png)

### Resources Management
#### Assigned Warehouses Menu
![alt text](readme/img/res_mgmt_assigned_warehouse.png)

#### Warehouse Management
##### Warehouse Imports
![alt text](readme/img/res_mgmt_imports.png)

##### Warehouse Exports
![alt text](readme/img/res_mgmt_exports.png)

##### Warehouse Stocks
![alt text](readme/img/res_mgmt_stocks.png)