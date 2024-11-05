# -*- coding: utf-8 -*-

from odoo import models, fields, api #import từ odoo


class daylamodulemoi(models.Model):
    _name = 'daylamodulemoi.daylamodulemoi' #tên bảng dữ liệu
    _description = 'daylamodulemoi.daylamodulemoi'  #mô tả bảng dữ liệu

    #các trường trong database
    name = fields.Char()   #vd: name = fields.Char(string='Name', required=True)
    value = fields.Integer()
    value2 = fields.Float(compute="_value_pc", store=True)
    description = fields.Text()

    @api.depends('value')
    def _value_pc(self):
        for record in self:
            record.value2 = float(record.value) / 100

