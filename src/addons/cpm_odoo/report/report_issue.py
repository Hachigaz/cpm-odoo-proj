from odoo import api, models
from collections import defaultdict

class IssueReport(models.AbstractModel):
    _name = "report.cpm_odoo.report_issue"
    _description = "Issue Report"

    @api.model
    def _get_report_values(self, docids, data=None):
        resolved_issues = self.env['cpm_odoo.risk_mgmt_issue'].search([('status', '=', 'resolved')])
        
        report_data = defaultdict(lambda: defaultdict(int))  # {month: {level: count}}
        total_by_month = defaultdict(int) 

        # Xử lý dữ liệu và nhóm theo tháng và level
        for issue in resolved_issues:
            # Lấy tháng và năm từ resolved_date
            if issue.resolved_date:
                month_year = issue.resolved_date.strftime('%Y-%m')  # Format là 'YYYY-MM'
                report_data[month_year][issue.level] += 1
                total_by_month[month_year] += 1

        # Trả về dữ liệu để hiển thị trên báo cáo
        return {
            'doc_ids': resolved_issues.ids,
            'doc_model': 'cpm_odoo.risk_mgmt_issue',
            'docs': resolved_issues,
            'report_data': report_data,  # Truyền dữ liệu đã nhóm theo tháng và level
            'total_by_month': total_by_month
        }