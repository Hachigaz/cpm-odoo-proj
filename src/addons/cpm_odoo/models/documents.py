from odoo import models,fields,api
from odoo.exceptions import ValidationError
import json
import base64

class DocumentSet_Abs(models.AbstractModel):
    _name = "cpm_odoo.documents_document_set_abs"
    _description = "Document Set"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'description'
    )
    
    document_ids = fields.One2many(
        comodel_name = 'cpm_odoo.documents_document', 
        inverse_name = 'document_set_id', 
        string='Documents'
    )
    
    updated_at = fields.Datetime(
        compute='_compute_updated_at', 
        string='updated_at',
        store=True
    )
    
    @api.depends('document_ids.date_uploaded')
    def _compute_updated_at(self):
        
        for record in self:
            return_date = False
            for doc in record.document_ids:
                if not return_date or return_date < doc.date_uploaded:
                    return_date=doc.date_uploaded
            record.updated_at = return_date
        pass
    
    document_count = fields.Integer(
        compute='_compute_document_count', 
        string='document_count',
        store=True
    )
    
    is_project_specific = fields.Boolean(
        string = 'is_project_specific',
        required=True,
        default=False
    )
    
    project_doc_mgmt_id = fields.Many2one(
        comodel_name = 'cpm_odoo.root_project_doc_mgmt', 
        string='project_doc_mgmt'
    )
    
    @api.constrains('project_doc_mgmt_id')
    def _constrains_project_doc_mgmt_id(self):
        for record in self:
            if self.is_project_specific and not self.project_doc_mgmt_id:
                raise ValidationError("Project specific documents must relate to a specific project")
            elif not self.is_project_specific and self.project_doc_mgmt_id:
                raise ValidationError("Document is not project specific but an id was provided")
        pass
    
    @api.depends('document_ids.date_uploaded')
    def _compute_document_count(self):
        
        for record in self:
            record.document_count = len(record.document_ids)
        pass
    
    @api.model
    def act_add_doc_to_set(self,doc_set_id):
        staff = self.env['cpm_odoo.human_res_staff'].search([('user_id', '=', self.env.user.id)])
        
        
        view = self.env.ref('cpm_odoo.document_add_form_view')

        return {
            "type": 'ir.actions.act_window',
            "name": 'Add Document',
            "res_model": 'cpm_odoo.documents_document',
            "view_mode": 'form',
            "views": [[view.id, 'form']],
            "target": 'current',
            "context": { 
                'default_document_set_id': doc_set_id,
                'default_uploaded_by': staff.id
            }
            # "context": { 'default_document_set_id': self.env.context.document_set_id },
        }
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            if(val.get('is_project_specific') or self.env.context.get('default_is_project_specific')):
                val["project_doc_mgmt_id"]=None
            if self.env.context.get('project_id'):
                project_id = self.env.context.get('project_id')
                val['project_doc_mgmt_id'] = self.env['cpm_odoo.root_project'].browse(project_id).proj_doc_id.id
                
        return super().create(vals)
    

class DocumentSet(models.Model):
    _name = "cpm_odoo.documents_document_set"
    _description = "Document Set"
    
    _inherit=['cpm_odoo.documents_document_set_abs']
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_category', 
        string='Category',
        ondelete = "restrict",
        default=None
    )
    
    def unlink(self):
        for record in self:
            recs = self.env["cpm_odoo.planning_task"].search(
                [
                    ['attached_document_ids','in',record.id]
                ]
            )
            if(len(recs)>0):
                raise ValidationError(f"Cannot delete document set {record.name}, it is linked to task {recs[0].name}")
        return super().unlink()
    
class Document(models.Model):
    _name = "cpm_odoo.documents_document_abs"
    _description = "Document"
    _rec_name="file_name"
    
    file = fields.Binary(
        string = 'File',
        required = True
    )
    
    file_name = fields.Char(
        string = "File Name",
        size = 2048,
        default= "File"
    )
    
    file_size = fields.Float("File Size (KB)", compute='_compute_file_size', store=True)

    @api.depends('file')
    def _compute_file_size(self):
        for record in self:
            if record.file:
                try:
                    file_size = round(len(base64.b64decode(record.file))/1024,2)
                    record.file_size = file_size
                except Exception as e:
                    # raise Exception(record.file)
                    pass
                # record.file_size = round(len(record.file) / 1024,2)  # KB size
                # if(record.file_size<10):
                #     raise Exception([record.file,type(record.file),record.file_size])
                # else:
                #     raise Exception([record.file_size,type(record.file)])
            else:
                record.file_size = 0
    
    date_uploaded = fields.Datetime(
        string = 'Date Uploaded',
        default = fields.Datetime.now()
    )
    
    uploaded_by = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='Uploaded By',
        readonly=True,
    )
    
    @api.model
    def act_download_file(self,id):
        record = (self.env['cpm_odoo.documents_document'].browse(id))[0]
        result = record.file
        base_url = self.env['ir.config_parameter'].get_param('web.base.url')
        attachment_obj = self.env['ir.attachment']
        attachment_id = attachment_obj.create(
            {'name': record.file_name, 'display_name': record.file_name, 'datas': result})
        download_url = '/web/content/' + str(attachment_id.id) + '?download=true'
        return {
            "type": "ir.actions.act_url",
            "url": str(base_url) + str(download_url),
            "target": "new",
        }
    
class Document(models.Model):
    _name = "cpm_odoo.documents_document"
    _description = "Document"
    
    _inherit="cpm_odoo.documents_document_abs"
    
    document_set_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_set', 
        string='document_set',
        required=True,
        ondelete = "cascade"
    )
    
class Contract(models.Model):
    _name = "cpm_odoo.contracts_contract"
    _description = "Document"
    
    _inherit="cpm_odoo.documents_document_abs"
    
    contract_set_id = fields.Many2one(
        comodel_name = 'cpm_odoo.contracts_contract_set', 
        string='contract_set',
        required=True,
        ondelete = "cascade"
    )
        
    
class DocumentCategory(models.Model):
    _name = "cpm_odoo.documents_document_category"
    _description = "Document Category"
    # _rec_name = "encoded_name"
    
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
    
    display = fields.Boolean(
        string = 'Display',
        required=True,
        default=False
    )
    
    # encoded_name = fields.Char(
    #     compute='_compute_encoded_name', 
    #     string='encoded_name',
    #     store=True
    # )
    
    # @api.depends('name','color')
    # def _compute_encoded_name(self):
    #     for record in self:    
    #         record.encoded_name = json.dumps({
    #             "name":record.name,
    #             "color":record.color
    #         })
    #     pass
    
class ContractSet(models.Model):
    _name = "cpm_odoo.contracts_contract_set"
    _description = "Contract Set"
    
    _inherit = "cpm_odoo.documents_document_set_abs"
    
    contractor_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_contractor', 
        string='contractor_id'
    )
    
    def write(self, vals):
        for record in self:
            if vals.get('contractor_id'):
                for record in self:
                    recs = self.env["cpm_odoo.planning_task_assign_contractor"].search(
                        [
                            ['contract_set_id','=',record.id]
                        ]
                    )
                    if(len(recs)>0):
                        raise ValidationError(f"Cannot change the contractor of the contract {record.name}, it is linked to task {recs[0].task_id.name}")
        return super().write(vals)
    
    def unlink(self):
        for record in self:
            recs = self.env["cpm_odoo.planning_task_assign_contractor"].search(
                [
                    ['contract_set_id','=',record.id]
                ]
            )
            if(len(recs)>0):
                raise ValidationError(f"Cannot delete contract set {record.name}, it is linked to task {recs[0].task_id.name}")
        return super().unlink()