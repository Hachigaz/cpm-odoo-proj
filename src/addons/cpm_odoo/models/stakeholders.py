from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json

class Stakeholder(models.AbstractModel):
    _name = "cpm_odoo.stakeholders_stakeholder"
    _description = "Model"
    
    _inherits = {
        "res.partner":"partner_id"
    }
    
    partner_id = fields.Many2one(
        comodel_name = 'res.partner', 
        string='Partner',
        required=True,
        ondelete="restrict"
    )

    description = fields.Text(
        string = 'Description'
    )
    
    address = fields.Char(
        string = 'Address',
        size = 1024
    )
    
class Contractor(models.Model):
    _name = "cpm_odoo.stakeholders_contractor"
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
    contractor_category_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.stakeholders_contractor_category', 
        string='Category',
        relation='cpm_odoo_contractor_cate_contractor',
        column1="contractor_cate_contractor_id",
        column2="contractor_cate_category_id"
    )
    
class ContractorCategory(models.Model):
    _name = "cpm_odoo.stakeholders_contractor_category"
    _description = "Model"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 64
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
class Investor(models.Model):
    _name = "cpm_odoo.stakeholders_investor"
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
class OtherContacts(models.Model):
    _name = "cpm_odoo.stakeholders_other_contacts"
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
class Supplier(models.Model):
    _name = 'cpm_odoo.stakeholders_supplier'
    _description = "Model"
    
    _inherit = "cpm_odoo.stakeholders_stakeholder"
    
    supplied_eqp_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.res_mgmt_equipment', 
        string='supplied_eqp'
    )
    
    @api.onchange('supplied_eqp_ids')
    def _onchange_supplied_eqp_ids(self):
        eqp_recs = self.env["cpm_odoo.res_mgmt_equipment"].search(
            [
                ['supplier_ids','in',self.id]
            ]
        )

        add_diff_recs = [item for item in eqp_recs if not any(eqp.id == item.id for eqp in self.supplied_eqp_ids)]
        
        for rec in add_diff_recs:
            rec.write({
                "supplier_ids":[(3,self.id)]
            })
            
        rem_diff_recs = [item for item in self.supplied_eqp_ids if not any(eqp.id == item.id for eqp in eqp_recs)]

        for rec in rem_diff_recs:
            rec.write({
                "supplier_ids":[(4,self.id)]
            })
    
    supplied_eqp_count = fields.Char(
        compute='_compute_supplied_eqp_count', 
        string='supplied_eqp_count',
        store=True
    )
    
    @api.depends('supplied_eqp_ids')
    def _compute_supplied_eqp_count(self):
        for record in self:
            record.supplied_eqp_count = len(record.supplied_eqp_ids)
        pass
    
    supplied_mat_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.res_mgmt_material', 
        string='supplied_mat'
    )
    
    @api.onchange('supplied_mat_ids')
    def _onchange_supplied_mat_ids(self):
        mat_recs = self.env["cpm_odoo.res_mgmt_material"].search(
            [
                ['supplier_ids','in',self.id]
            ]
        )

        add_diff_recs = [item for item in mat_recs if not any(mat.id == item.id for mat in self.supplied_mat_ids)]
        
        for rec in add_diff_recs:
            rec.write({
                "supplier_ids":[(3,self.id)]
            })
            
        rem_diff_recs = [item for item in self.supplied_mat_ids if not any(mat.id == item.id for mat in mat_recs)]

        for rec in rem_diff_recs:
            rec.write({
                "supplier_ids":[(4,self.id)]
            })
            
    
    supplied_mat_count = fields.Char(
        compute='_compute_supplied_mat_count', 
        string='supplied_mat_count',
        store=True
    )
    
    @api.depends('supplied_mat_ids')
    def _compute_supplied_mat_count(self):
        for record in self:
            record.supplied_mat_count = len(record.supplied_mat_ids)
        pass
    
    supplier_type = fields.Selection(
        [
            ('material_supplier', 'Material Supplier'),
            ('equipment_supplier', 'Equipment Supplier'),
            ('general_supplier', 'Genreral Supplier')
        ], 
        string='supplier_type',
        required=True
    )