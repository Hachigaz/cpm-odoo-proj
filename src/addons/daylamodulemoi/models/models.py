# -*- coding: utf-8 -*-

from odoo import models, fields, api #import từ odoo


class daylamodulemoi(models.Model):
    _name = 'daylamodulemoi.daylamodulemoi' #tên bảng dữ liệu
    _description = 'daylamodulemoi.daylamodulemoi'  #mô tả bảng dữ liệu

    #các trường (fields) trong database
    name = fields.Char()   #vd: name = fields.Char(string='Name', required=True)
    value = fields.Integer()
    value2 = fields.Float(compute="_value_pc", store=True)
    description = fields.Text()

    @api.depends('value')
    def _value_pc(self):
        for record in self:
            record.value2 = float(record.value) / 100

class StakeHolder(models.Model):
    _name = 'daylamodulemoi.models_StakeHolder' #tên bảng dữ liệu 
    _description = ''
    #stakeholder_id = fields.Many2one('cpm_odoo.stakeholders_stakeholder', string='Stakeholder') #tên bảng bên module chính và tên model
    _inherit = "cpm_odoo.stakeholders_stakeholder"


