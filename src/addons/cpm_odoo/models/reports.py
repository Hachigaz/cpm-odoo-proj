from odoo import models,fields,api
from odoo.exceptions import ValidationError
import json
import base64


class Risk(models.AbstractModel):
    _name = "cpm_odoo.issue_report"
    _description="Issue Report"
    
    def _get_report_values(self, docids, data=None):
        # # get the report action back as we will need its data
        # report = self.env['ir.actions.report']._get_report_from_name('module.report_name')
        # # get the records selected for this rendering of the report
        # obj = self.env[report.model].browse(docids)
        # # return a custom rendering context
        project_id = self.env.context.get("project_id")
        date_generated = fields.Date.today()
        
        raise ValidationError(project_id)
        
        return {
            'report_title':'Issue Report',
            'date_generated':date_generated,
            'issue_recs':[1,2,3,4],
            'risk_recs':[],
            'project_id':project_id,
        }