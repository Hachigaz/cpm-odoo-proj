# -*- coding: utf-8 -*-
{
    'name': "asd",

    'summary': "Short (1 phrase/line) summary of the module's purpose",

    'description': """
Long description of module's purpose
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",
    'license': 'AGPL-3',

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','web','mail','web_widget_colorpicker'],

    # always loaded
    'data': [
        'security/ir.module.category.csv',
        'security/res.groups.csv',
        'security/ir.rule.csv',
        'security/ir.model.access.csv',
        
        'views/views.xml',
        'views/project/project_acts.xml',
        'views/project/project_mgmt_acts.xml',
        'views/project/project_works_acts.xml',
        
        'views/project/project_select_overview.xml',
        'views/project/project_create.xml',
        'views/project/project_overview.xml',
        
        'views/project/planning/tasks/task_note_forms.xml',
        'views/project/planning/tasks/create_task.xml',
        'views/project/planning/tasks/create_task_expense.xml',
        'views/project/planning/tasks/task_detail_forms.xml',
        'views/project/planning/workflows/create_workflow.xml',
        
        'views/project/finance/expense_category_create.xml',
        'views/project/finance/expense_record_create.xml',
        'views/project/finance/investment_record_create.xml',
        
        'views/doc_mgmt/document_category_create.xml',
        'views/doc_mgmt/document_set_create.xml',
        'views/doc_mgmt/add_doc_to_set_form.xml',
        'views/doc_mgmt/contract_views.xml',
        'views/doc_mgmt/contract_set_create.xml',
        
        'views/hr_mgmt/hr_acts.xml',
        'views/hr_mgmt/staff_create.xml',
        'views/hr_mgmt/staff_view.xml',
        

        'views/stakeholders/investor_view.xml',
        'views/stakeholders/stackholder_acts.xml',
        'views/stakeholders/contractor_view.xml',
        'views/stakeholders/contractor_category_create.xml',
        'views/stakeholders/supplier_view.xml',
        'views/stakeholders/other_contact_view.xml',

        'views/res_mgmt/res_mgmt_acts.xml',
        'views/res_mgmt/views/warehouse_info/warehouse_info_create.xml',
        'views/res_mgmt/views/warehouse_info/assigned_warehouse_kanban.xml',
        'views/res_mgmt/views/mat/material_create.xml',
        'views/res_mgmt/views/mat/material_type_create.xml',
        'views/res_mgmt/views/eqp/equipment_create.xml',
        'views/res_mgmt/views/eqp/equipment_type_create.xml',
        'views/res_mgmt/equipment_view.xml',
        'views/res_mgmt/material_view.xml',
        'views/res_mgmt/views/imports/mat_import_record_create.xml',
        'views/res_mgmt/views/imports/eqp_import_record_create.xml',
        'views/res_mgmt/views/exports/mat_export_record_create.xml',
        'views/res_mgmt/views/exports/eqp_export_record_create.xml',
        
        'views/issue/issue_acts.xml',
        'views/issue/issue_create.xml',
        'views/issue/issue_overview.xml',
        'views/issue/issue_select_view.xml',
        'views/issue/issue_dashboard.xml',
        'views/issue/issue_report_template.xml',
        
        'views/risk_mgmt/risk_acts.xml',
        'views/risk_mgmt/risk_create.xml',
        'views/risk_mgmt/risk_overview.xml',
        'views/risk_mgmt/solution_create.xml',
        
        # 'init_res/dump/cpm_odoo.root_project_hrm.csv',
        # 'init_res/dump/cpm_odoo.root_project_planning.csv',
        # 'init_res/dump/cpm_odoo.root_project_finance.csv',
        # 'init_res/dump/cpm_odoo.root_project_doc_mgmt.csv',
        # 'init_res/dump/cpm_odoo.root_project.csv',
        'init_res/cpm_odoo.human_res_department.csv',
        'init_res/cpm_odoo.human_res_staff.csv',
        'init_res/cpm_odoo.documents_document_category.csv',
        'init_res/cpm_odoo.documents_document_set.csv',
        'init_res/cpm_odoo.res_mgmt_eqp_type.csv',
        'init_res/cpm_odoo.res_mgmt_equipment.csv',
        'init_res/cpm_odoo.res_mgmt_mat_type.csv',
        'init_res/cpm_odoo.res_mgmt_material.csv',
        'init_res/cpm_odoo.res_mgmt_material.csv',
        
        'init_res/cpm_odoo.risk_mgmt_category.csv',
        'init_res/cpm_odoo.risk_mgmt_issue_category.csv',
        
        'init_res/cpm_odoo.stakeholders_contractor_category.csv',
        'init_res/cpm_odoo.stakeholders_contractor.csv',
        'init_res/cpm_odoo.stakeholders_investor.csv',
        'init_res/cpm_odoo.stakeholders_supplier.csv',
        'init_res/cpm_odoo.stakeholders_other_contacts.csv',
        
        'init_res/cpm_odoo.planning_task_note_category.csv',
    ],
    'assets': {
        'web.assets_backend': [
            'cpm_odoo/static/src/backend/**/*',
        ],
        'web.assets_frontend': [
            
        ],
    },
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'pre_init_hook': '_test',
    'post_init_hook': '_process_install_module',
}