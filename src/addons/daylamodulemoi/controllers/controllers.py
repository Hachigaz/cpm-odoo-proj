# -*- coding: utf-8 -*-
from odoo import http


class Daylamodulemoi(http.Controller):
    @http.route('/daylamodulemoi/daylamodulemoi', auth='public')
    def index(self, **kw):
        return "Hello, world"

    @http.route('/daylamodulemoi/daylamodulemoi/objects', auth='public')
    def list(self, **kw):
        return http.request.render('daylamodulemoi.listing', {
            'root': '/daylamodulemoi/daylamodulemoi',
            'objects': http.request.env['daylamodulemoi.daylamodulemoi'].search([]),
        })

    @http.route('/daylamodulemoi/daylamodulemoi/objects/<model("daylamodulemoi.daylamodulemoi"):obj>', auth='public')
    def object(self, obj, **kw):
        return http.request.render('daylamodulemoi.object', {
            'object': obj
        })

