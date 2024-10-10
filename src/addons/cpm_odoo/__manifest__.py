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
    'depends': ['base','web'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        # 'security/res.groups.csv',
        'views/views.xml',
        'views/templates.xml',
        'views/project/project_select_overview.xml',
        'views/project/project_create.xml',
        'views/hr_mgmt/staff_create.xml',
        'views/stakeholders/contractor_create.xml',
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