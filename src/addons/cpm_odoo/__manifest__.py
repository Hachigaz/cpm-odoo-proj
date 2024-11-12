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
    'depends': ['base','web','web_widget_colorpicker'],

    # always loaded
    'data': [
        'security/res.groups.csv',
        # 'security/ir.rule.csv',
        # 'security/ir.model.access.csv',
        
        'views/views.xml',
        'views/project/project_actions.xml',
        'views/templates.xml',
        
        'views/project/project_select_overview.xml',
        'views/project/project_create.xml',
        'views/project/project_overview.xml',
        'views/project/planning/tasks/create_task.xml',
        'views/project/planning/tasks/create_task_expense.xml',
        'views/project/planning/workflows/create_workflow.xml',
        
        'views/doc_mgmt/document_category_create.xml',
        'views/doc_mgmt/document_set_create.xml',
        'views/doc_mgmt/add_doc_to_set_form.xml',
        
        'views/hr_mgmt/hr_acts.xml',
        'views/hr_mgmt/staff_create.xml',
        
        'views/stakeholders/contractor_create.xml',
        
        'views/res_mgmt/res_mgmt_acts.xml',
        
        
        # 'init_res/cpm_odoo.root_project_hrm.csv',
        # 'init_res/cpm_odoo.root_project_planning.csv',
        # 'init_res/cpm_odoo.root_project_finance.csv',
        # 'init_res/cpm_odoo.root_project_doc_mgmt.csv',
        # 'init_res/cpm_odoo.root_project.csv',
        'init_res/cpm_odoo.stakeholders_contractor_category.csv',
        'init_res/cpm_odoo.stakeholders_contractor.csv',
        'init_res/cpm_odoo.human_res_department.csv',
        'init_res/cpm_odoo.human_res_staff.csv',
        'init_res/cpm_odoo.documents_document_category.csv',
        'init_res/cpm_odoo.documents_document_set.csv',
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
}