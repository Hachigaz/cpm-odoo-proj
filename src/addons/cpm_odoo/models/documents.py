from odoo import models,fields,api
import json
import base64

class DocumentSet(models.Model):
    _name = "cpm_odoo.documents_document_set"
    _description = "Document Set"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'description'
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_category', 
        string='Category',
        ondelete = "restrict"
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
    
class Document(models.Model):
    _name = "cpm_odoo.documents_document"
    _description = "Document"
    _rec_name="file_name"
    
    document_set_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_set', 
        string='document_set',
        required=True,
        ondelete = "cascade"
    )
    
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
        
    
class DocumentCategory(models.Model):
    _name = "cpm_odoo.documents_document_category"
    _description = "Document Category"
    _rec_name = "encoded_name"
    
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
    
    encoded_name = fields.Char(
        compute='_compute_encoded_name', 
        string='encoded_name',
        store=True
    )
    
    @api.depends('name','color')
    def _compute_encoded_name(self):
        for record in self:    
            record.encoded_name = json.dumps({
                "name":record.name,
                "color":record.color
            })
        pass