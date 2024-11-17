# -*- coding: utf-8 -*-'

from odoo import http
from odoo.http import request

class ProjectController(http.Controller):
    
    @http.route('/proj/authorize', type='json', auth='user',csrf=False)
    def authorize_user(self):
        # Get the currently logged-in user
        user = request.env.user
        
        groups = request.env['res.groups'].search([])  # Empty domain retrieves all groups
        
        
        
        
        # request.env['res.users'].has_group('')
        token = request.csrf_token()
        
        data = {
            # "groups_id":[(group.id,group.name) for group in user.groups_id],
            "csrf_token":token
        }
        return data
    
    @http.route('/proj/view/get_view/<string:view_id>', type='http', auth='user')
    def get_view(self, view_id):
        
        view_id = "cpm_odoo."+view_id
        
        view = request.env['ir.ui.view'].search([('xml_id', '=', view_id)], limit=1)

        # Check if the view exists
        if not view.exists():
            return request.not_found()

        # Render the view's XML
        return request.render(view.id)
    
    @http.route('/action/get/<string:action_id>', type='json', auth='user', csrf=False)
    def get_action(self, action_id):
        action = request.env.ref(action_id)
        
        context_values = request.params
        
        context_string = '&'.join(f"{key}={value}" for key, value in context_values.items())
        
        return '/web#action={}&{}'.format(action.id,context_string)