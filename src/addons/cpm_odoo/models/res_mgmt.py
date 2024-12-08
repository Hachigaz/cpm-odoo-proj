from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json


class Equipment(models.Model):
    _name = 'cpm_odoo.res_mgmt_equipment'
    _description = "Equipment"
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    eqp_type_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_eqp_type', 
        string='Equipment Type',
        ondelete= 'restrict',
        required=True
    )
    
    supplier_ids = fields.Many2many(
        comodel_name="cpm_odoo.stakeholders_supplier",
        string='supplier_ids'
    )
    
class EquipmentType(models.Model):
    _name = 'cpm_odoo.res_mgmt_eqp_type'
    _description = "Equipment Type"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
class Material(models.Model):
    _name = 'cpm_odoo.res_mgmt_material'
    _description = "Material"
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    mat_type_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_mat_type', 
        string='Material Type',
        ondelete= 'restrict',
        required=True
    )
    
    supplier_ids = fields.Many2many(
        comodel_name="cpm_odoo.stakeholders_supplier",
        string='supplier_ids'
    )
    
class MaterialType(models.Model):
    _name = 'cpm_odoo.res_mgmt_mat_type'
    _description = "Material Type"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )

class Mat_Res_Record(models.AbstractModel):
    _name = 'cpm_odoo.res_mgmt_mat_res_rec'
    _description = "Material Record"
    
    material_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_material', 
        string='Material',
        required=True,
        ondelete='restrict'
    )
    
    amount = fields.Float(
        string = 'Amount',
        default = 0.0
    )
    
class Eqp_Res_Record(models.AbstractModel):
    _name = 'cpm_odoo.res_mgmt_eqp_res_rec'
    _description = "Model"
    
    equipment_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_equipment', 
        string='Equipment',
        required=True,
        ondelete='restrict'
    )
    
    amount = fields.Integer(
        string = 'Amount',
        default = 0
    )
    
    
    
class WarehouseInfo(models.Model):
    _name = 'cpm_odoo.res_mgmt_warehouse_info'
    _description = 'model.technical.name'
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    address  = fields.Char(
        string = 'Address',
        size = 1024
    )
    
    mat_storage_rec_ids = fields.One2many(
        comodel_name = 'cpm_odoo.res_mgmt_mat_storage_rec', 
        inverse_name = 'warehouse_id', 
        string='mat_storage_rec'
    )
    
    eqp_storage_rec_ids = fields.One2many(
        comodel_name = 'cpm_odoo.res_mgmt_eqp_storage_rec', 
        inverse_name = 'warehouse_id', 
        string='eqp_storage_rec'
    )
    
    mat_imp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_mat_imp_rec', 'warehouse_id', string='mat_imp_rec'
    )
    
    eqp_imp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_imp_rec', 'warehouse_id', string='eqp_imp_rec'
    )
    
    mat_exp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_mat_exp_rec', 'warehouse_id', string='mat_exp_rec'
    )
    
    eqp_exp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_exp_rec', 'warehouse_id', string='eqp_exp_rec'
    )
    
    avail_eqps = fields.Many2many(
        comodel_name="cpm_odoo.res_mgmt_equipment",
        relation="avail_eqp_in_wareh",
        column1="wid",
        column2="item_id",
        compute='_compute_avail_eqps', string='avail_eqps',
        store=True
    )
    
    @api.depends('eqp_storage_rec_ids')
    def _compute_avail_eqps(self):
        for w_rec in self:
            w_rec.avail_eqps.unlink()
            w_rec.write({
                'avail_eqps':[(4,rec.equipment_id.id,0) for rec in w_rec.eqp_storage_rec_ids if rec.amount > 0]
            })
            
        pass
    
    avail_mats = fields.Many2many(
        comodel_name="cpm_odoo.res_mgmt_material",
        relation="avail_mat_in_wareh",
        column1="wid",
        column2="item_id",
        compute='_compute_avail_mats', string='avail_mats',
        store=True
    )
    
    @api.depends('mat_storage_rec_ids')
    def _compute_avail_mats(self):
        for w_rec in self:
            w_rec.avail_mats.unlink()
            w_rec.write({
                'avail_mats':[(4,rec.material_id.id,0) for rec in w_rec.mat_storage_rec_ids if rec.amount > 0]
            })
            
        pass
    
    warehouse_manager_group_id = fields.Many2one(
        comodel_name = 'res.groups', 
        string='head_mgmt_group',
        readonly=True,
        ondelete="restrict"
    )
    
    warehouse_manager_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='warehouse_manager',
        relation='proj_warehouse_managers_tab',
        column1="pid",
        column2="sid"
    )
        
    def add_warehouse_manager(self,staff_id):
        for record in self:
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[4,record.warehouse_manager_group_id.id]]
            })
        pass
    
    def rem_warehouse_manager(self,staff_id):
        for record in self:
            staff_rec = self.env["cpm_odoo.human_res_staff"].sudo().search(["&",['id','=',staff_id],"|",['active','=',True],['active','=',False]])[0]
            staff_rec.write({
                'groups_id':[[3,record.warehouse_manager_group_id.id]]
            })
        pass
    
    def act_edit_info(self):
        for rec in self:
            return {
                'type': 'ir.actions.act_window',
                'view_mode': 'form',
                'name': 'Edit Warehouse Info',
                'res_model': 'cpm_odoo.res_mgmt_warehouse_info',
                'res_id':rec.id,
                'views':[(False,'form')],
                'context': {
                    
                },
                'target': 'new'
            }
    
    @api.model_create_multi
    def create(self, vals):
        recs = super().create(vals)
        for record in recs:
            head_mgmt_gr_rec = self.env["res.groups"].sudo().create({
                "id":f"cpm_gr.proj{record.id}",
                "name":f"Warehouse Manager Group {record.id}",
                "implied_ids":[self.env.ref("cpm_gr.warehouse_manager").id],
                "comment":f"Warehouse Manager Group {record.id}"
            })
            
            record.warehouse_manager_group_id = head_mgmt_gr_rec.id
            
            record.add_warehouse_manager(self.env["cpm_odoo.human_res_staff"].search(["&",["user_id",'=',self.env.user.id],"|",['active','=',True],['active','=',False]]).id)
        
        return recs
    
    def write(self, vals):
        for rec in self:
            staff_ids = vals.get('warehouse_manager_ids')
            if staff_ids:
                added_ids = [rec[1] for rec in staff_ids if rec[0] == 4]
                deleted_ids = [rec[1] for rec in staff_ids if rec[0] == 3]
                
                add_staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().browse(added_ids)
                del_staff_recs = self.env["cpm_odoo.human_res_staff"].sudo().browse(deleted_ids)
                
                for srec in add_staff_recs:
                    srec.write({
                        'groups_id':[(4,rec.warehouse_manager_group_id.id)]
                    })
                    
                for srec in del_staff_recs:
                    srec.write({
                        'groups_id':[(3,rec.warehouse_manager_group_id.id)]
                    })
        return super().write(vals)
    
class Mat_StorageRecord(models.Model):
    _name = 'cpm_odoo.res_mgmt_mat_storage_rec'
    _description = "Model"

    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']

    
class Eqp_StorageRecord(models.Model):
    _name = 'cpm_odoo.res_mgmt_eqp_storage_rec'
    _description = "Model"
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']