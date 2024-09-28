# -*- coding: utf-8 -*-
# from odoo import http


# class Cpm-addon(http.Controller):
#     @http.route('/cpm-addon/cpm-addon', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/cpm-addon/cpm-addon/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('cpm-addon.listing', {
#             'root': '/cpm-addon/cpm-addon',
#             'objects': http.request.env['cpm-addon.cpm-addon'].search([]),
#         })

#     @http.route('/cpm-addon/cpm-addon/objects/<model("cpm-addon.cpm-addon"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('cpm-addon.object', {
#             'object': obj
#         })

