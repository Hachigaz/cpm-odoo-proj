# -*- coding: utf-8 -*-
# from odoo import http


# class Cpm-addon(http.Controller):
#     @http.route('/cpm_odoo/cpm_odoo', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/cpm_odoo/cpm_odoo/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('cpm_odoo.listing', {
#             'root': '/cpm_odoo/cpm_odoo',
#             'objects': http.request.env['cpm_odoo.cpm_odoo'].search([]),
#         })

#     @http.route('/cpm_odoo/cpm_odoo/objects/<model("cpm_odoo.cpm_odoo"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('cpm_odoo.object', {
#             'object': obj
#         })