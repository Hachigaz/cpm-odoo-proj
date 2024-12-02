from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json

class Abs_ImportRecord(models.AbstractModel):
    _name = 'cpm_odoo.logistics_abs_imp_rec'
    _description = 'model.technical.name'
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    supplier_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_supplier', 
        string='supplier'
    )

    date_created = fields.Datetime(
        string = 'Date Created',
        default = fields.Datetime.now(),
        required = True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string = 'Created By'
    )
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            staff = self.env["cpm_odoo.human_res_staff"].search([('user_id', '=', self.env.user.id)], limit=1)
            if(len(staff)>0):
                val["created_by"] = staff.id
        return super().create(vals)

class Mat_ImportRecord(models.Model):
    _name = 'cpm_odoo.logistics_mat_imp_rec'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_abs_imp_rec']
    
    imp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_imp_rec_det', 
        'imp_rec_id', 
        string='imp_det'
    )
    
    trans_imp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_imp_rec_det_transient', 
        'imp_rec_id', 
        string='trans_imp_det'
    )
    
    @api.onchange('supplier_id')
    def _onchange_supplier_id(self):
        for record in self.imp_det_ids:
            record.unlink()
        self.write({
            'imp_det_ids':[(5,0,0)]
        })
        pass
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'mat_imp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
    
    is_verified = fields.Boolean(
        string = 'is_verified',
        required = True,
        default = False
    )
    
    def act_verify_record(self):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot verify import record that is already verified.")
            else:
                record.is_verified = True
                for imp_det in record.imp_det_ids:
                    s_rec = [s_rec for s_rec in self.warehouse_id.mat_storage_rec_ids if s_rec.material_id == imp_det.material_id]
                    if len(s_rec)==1:
                        s_rec = s_rec[0]
                        s_rec.amount += imp_det.amount
                    else:
                        self.warehouse_id.write({
                            'mat_storage_rec_ids':[(0,0,{
                                'material_id':imp_det.material_id.id,
                                'amount':imp_det.amount
                            })]
                        })
                        
    def write(self, vals):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot edit verified import record.")
        return super().write(vals)
    
    
class Mat_ImportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_mat_imp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']
    
    imp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_mat_imp_rec', 
        string='imp_rec',
        required=True
    )
    
    @api.constrains('material_id')
    def _constrains_material_id(self):
        for record in self:
            supplier_rec = record.imp_rec_id.supplier_id
            if not any(record.material_id.id  == rec.id for rec in supplier_rec.supplied_mat_ids):
                raise ValidationError(f"The supplier {supplier_rec.name} does not supply the material {record.material_id.name}")
        pass
    
class Mat_ImportRecordDetail_Transient(models.TransientModel):
    _name = 'cpm_odoo.logistics_mat_imp_rec_det_transient'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_mat_imp_rec_det']

class Eqp_ImportRecord(models.Model):
    _name = 'cpm_odoo.logistics_eqp_imp_rec'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_abs_imp_rec']
    
    imp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_imp_rec_det', 
        'imp_rec_id', 
        string='imp_det'
    )
    
    trans_imp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_imp_rec_det_transient', 
        'imp_rec_id', 
        string='trans_imp_det'
    )
    
    @api.onchange('supplier_id')
    def _onchange_supplier_id(self):
        for record in self.imp_det_ids:
            record.unlink()
        self.write({
            'imp_det_ids':[(5,0,0)]
        })
        pass
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'eqp_imp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
    
    is_verified = fields.Boolean(
        string = 'is_verified',
        required = True,
        default = False
    )
    
    def act_verify_record(self):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot verify import record that is already verified.")
            else:
                record.is_verified = True
                for imp_det in record.imp_det_ids:
                    s_rec = [s_rec for s_rec in self.warehouse_id.eqp_storage_rec_ids if s_rec.equipment_id == imp_det.equipment_id]
                    if len(s_rec)==1:
                        s_rec = s_rec[0]
                        s_rec.amount += imp_det.amount
                    else:
                        self.warehouse_id.write({
                            'eqp_storage_rec_ids':[(0,0,{
                                'equipment_id':imp_det.equipment_id.id,
                                'amount':imp_det.amount
                            })]
                        })
                        
    def write(self, vals):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot edit verified import record.")
        return super().write(vals)
    
class Eqp_ImportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_eqp_imp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']
    
    imp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_eqp_imp_rec', 
        string='imp_rec',
        required=True
    )
    
    @api.constrains('equipment_id')
    def _constrains_equipment_id(self):
        for record in self:
            supplier_rec = record.imp_rec_id.supplier_id
            if not any(record.equipment_id.id  == rec.id for rec in supplier_rec.supplied_eqp_ids):
                raise ValidationError(f"The supplier {supplier_rec.name} does not supply the equipment {record.equipment_id.name}")
        pass
    
class Eqp_ImportRecordDetail_Transient(models.TransientModel):
    _name = 'cpm_odoo.logistics_eqp_imp_rec_det_transient'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_eqp_imp_rec_det']
    
class Abs_ExportRecord(models.AbstractModel):
    _name = 'cpm_odoo.logistics_abs_exp_rec'
    _description = 'model.technical.name'
    
    export_type = fields.Selection(
        [
            ('site_delivery', 'Site Delivery'),
            ('warehouse_transfer', 'Warehouse Transfer') 
        ], 
        string='export_type',
        default="site_delivery"
    )
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )

    date_created = fields.Datetime(
        string = 'Date Created',
        default = fields.Datetime.now(),
        required = True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string = 'Created By'
    )
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            staff = self.env["cpm_odoo.human_res_staff"].search([('user_id', '=', self.env.user.id)], limit=1)
            if(len(staff)>0):
                val["created_by"] = staff.id
        return super().create(vals)
    
    delivered_by = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='delivered_by',
        required=True
    )
    
    is_delivered = fields.Boolean(
        string = 'is_delivered',
        default=False,
        required=True
    )

    delivered_at = fields.Datetime(
        string = 'delivered_at'
    )
    
    def act_delivered(self):
        for record in self:
            record.is_delivered = True
            record.delivered_at = fields.Datetime.now()


class Mat_ExportRecord(models.Model):
    _name = 'cpm_odoo.logistics_mat_exp_rec'
    _description = 'model.technical.name'
    
    _inherit = ["cpm_odoo.logistics_abs_exp_rec"]
    
    exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_exp_rec_det', 
        'exp_rec_id', 
        string='exp_det'
    )
    
    trans_exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_exp_rec_det_transient', 
        'exp_rec_id', 
        string='trans_exp_det'
    )
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'mat_exp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for record in self:
            storage_rec = self.env["cpm_odoo.res_mgmt_mat_storage_rec"].search(
                [
                    ['warehouse_id','=',record.imp_rec_id.warehouse_id.id],
                    ['material_id','=',record.material_id.id]
                ]
            )
            if (not storage_rec) or storage_rec.amount - reocrd.amount < 0:
                raise ValidationError(f"There is not enough material {record.material_id.name} ({record.storage_rec.amount}) in warehouse {record.imp_rec_id.warehouse_id.name} to export")
        pass

class Mat_ExportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_mat_exp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']
    
    exp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_mat_exp_rec', 
        string='exp_rec',
        required=True
    )
    
class Mat_ExportRecordDetail_Transient(models.TransientModel):
    _name = 'cpm_odoo.logistics_mat_exp_rec_det_transient'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_mat_exp_rec_det']
    
class Eqp_ExportRecord(models.Model):
    _name = 'cpm_odoo.logistics_eqp_exp_rec'
    _description = 'model.technical.name'
    
    _inherit = ["cpm_odoo.logistics_abs_exp_rec"]
    
    exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_exp_rec_det', 
        'exp_rec_id', 
        string='exp_det'
    )
    
    trans_exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_exp_rec_det_transient', 
        'exp_rec_id', 
        string='trans_exp_det'
    )
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'eqp_exp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for record in self:
            storage_rec = self.env["cpm_odoo.res_mgmt_eqp_storage_rec"].search(
                [
                    ['warehouse_id','=',record.imp_rec_id.warehouse_id.id],
                    ['equipment_id','=',record.equipment_id.id]
                ]
            )
            if (not storage_rec) or storage_rec.amount - reocrd.amount < 0:
                raise ValidationError(f"There is not enough equipment {record.equipment_id.name} ({record.storage_rec.amount}) in warehouse {record.imp_rec_id.warehouse_id.name} to export")
        pass
    
class Eqp_ExportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_eqp_exp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']
    
    exp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_eqp_exp_rec', 
        string='exp_rec',
        required=True
    )
    
class Eqp_ExportRecordDetail_Transient(models.TransientModel):
    _name = 'cpm_odoo.logistics_eqp_exp_rec_det_transient'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_eqp_exp_rec_det']