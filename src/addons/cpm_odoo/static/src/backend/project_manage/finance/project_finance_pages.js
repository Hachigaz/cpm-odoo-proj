/** @odoo-module **/
import { GanttDisplay, ItemList, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, joinDatas} from "../../components/component_utils";
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { formatCurrency, processTransactionList } from "./components";



class ProjectFinanceDashboardTab extends Component {
    static template = "cpm_odoo.ProjectFinanceDashboardTab"
    static formatDateTime = formatDateTime
    setup(){
        this.finance_id = this.props.context_data.finance_id

        this.page_data = useState({
            total_investments_value : 0,
            total_investments_data : [],
            total_expenses_value : 0,
            total_expenses_data : [],
            current_budget: 0,
            recent_transactions: [],
            pending_transactions: []
        })

        this.charts = {

        }

        this.orm = useService("orm")
        this.action = useService("action")
        this.loadData()

        useEffect(
            ()=>{
                this.setupCharts()
            },
            ()=>[this.page_data]
        )
    }

    async setupCharts(){
        //get chart content
        await this.getTotalInvestmentsChartData()
        await this.getTotalExpensesChartData()

        let ctx = document.querySelector("#finance-overview-section #total-investments-chart .chart").getContext('2d');

        this.charts.totalInvestmentsChart = new Chart(ctx, {
            type: 'pie',  // Specify the chart type
            data: {
                labels: this.page_data.total_investments_data.map(item=>{console.log(item);return item.investor_id.name}),  // Add labels for the segments
                datasets: [{
                    label: 'Total Investments',
                    data: this.page_data.total_investments_data.map(item=>item.total_investments),  // Values for each segment
                    // backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],  // Colors for each segment
                    hoverOffset: 4  // Offset for hovering effect
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            // Format tooltip with '$' symbol
                            label: (context) => {
                                return this.page_data.total_investments_data[context.dataIndex].d_total_investments;  // Add $ symbol in the tooltip
                            }
                        }
                    }
                }
            }
        });


        ctx = document.querySelector("#finance-overview-section #total-expenses-chart .chart").getContext('2d');

        this.charts.totalExpensesChart = new Chart(ctx, {
            type: 'pie',  // Specify the chart type
            data: {
                labels: this.page_data.total_expenses_data.map(item=>item.category_id?item.category_id.name:"Other"),  // Add labels for the segments
                datasets: [{
                    label: 'Total Expenses',
                    data: this.page_data.total_expenses_data.map(item=>item.total_expenses),  // Values for each segment
                    hoverOffset: 4  // Offset for hovering effect
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            // Format tooltip with '$' symbol
                            label: (context) => {
                                return this.page_data.total_expenses_data[context.dataIndex].d_total_expenses;  // Add $ symbol in the tooltip
                            }
                        }
                    }
                }
            }
        });
    }

    async getTotalInvestmentsChartData(){
        let finance_rec = await this.orm.call(
            "cpm_odoo.root_project_finance",
            "search_read",
            [
                [
                    ['id','=',this.finance_id],
                ],
                ['total_investments','total_expenses'],
                0,1,
                ""
            ]
        )

        this.page_data.total_investments_value = finance_rec[0].total_investments
        this.page_data.total_expenses_value = finance_rec[0].total_expenses

        let tot_inv_data = await this.orm.call(
            "cpm_odoo.project_investor_investment_record",
            "search_read",
            [
                [
                    ['project_finance_id','=',this.finance_id],
                ],
                ['total_investments','investor_id','cur_id'],
                0,0,
                ""
            ]
        )

        await joinDatas(tot_inv_data,this.orm,[
            ["investor_id","cpm_odoo.stakeholders_investor",["id","name"]],
            ["cur_id","res.currency"]
        ])
        
        tot_inv_data.forEach((rec,idx)=>{
            tot_inv_data[idx]["d_total_investments"] = formatCurrency(rec.total_investments,rec.cur_id)
        })
        console.log(tot_inv_data)

        if(tot_inv_data.length>0){
            this.page_data.total_investments_data = tot_inv_data;
        }
    }

    async getTotalExpensesChartData(){
        let finance_rec = await this.orm.call(
            "cpm_odoo.root_project_finance",
            "search_read",
            [
                [
                    ['id','=',this.finance_id],
                ],
                ['total_expenses','total_expenses'],
                0,1,
                ""
            ]
        )

        this.page_data.total_expenses_value = finance_rec[0].total_expenses
        this.page_data.total_expenses_value = finance_rec[0].total_expenses

        let tot_exp_data = await this.orm.call(
            "cpm_odoo.project_category_expense_record",
            "search_read",
            [
                [
                    ['project_finance_id','=',this.finance_id],
                ],
                ['total_expenses','category_id','cur_id'],
                0,0,
                ""
            ]
        )

        await joinDatas(tot_exp_data,this.orm,[
            ["category_id","cpm_odoo.finance_expense_category",["id","name"]],
            ["cur_id","res.currency"]
        ])
        
        tot_exp_data.forEach((rec,idx)=>{
            tot_exp_data[idx]["d_total_expenses"] = formatCurrency(rec.total_expenses,rec.cur_id)
        })
        console.log(tot_exp_data)

        if(tot_exp_data.length>0){
            this.page_data.total_expenses_data = tot_exp_data;
        }
    }

    async get_recent_transactions(){
        const today = new Date();
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
        // Format the date as YYYY-MM-DDTHH:MM:SS (ISO 8601 format)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
        
        let investments_list = await this.orm.call(
            "cpm_odoo.finance_investment_record",
            "search_read",
            [
                [
                    ['project_finance_id','=',parseInt(this.finance_id)],
                    ['date_created','>=',thirtyDaysAgoStr],
                    ['status','!=','pending']
                ],
                ['id','title','description','amount','cur_id','status','investor_id','created_by','date_created'],
                0,0,
                "date_created desc"
            ]
        )
        
        let expenses_list = await this.orm.call(
            "cpm_odoo.finance_expense_record",
            "search_read",
            [
                [
                    ['project_finance_id','=',parseInt(this.finance_id)],
                    ['date_created','>=',thirtyDaysAgoStr],
                    ['status','!=','pending']
                ],
                ['id','title','description','amount','cur_id','status','category_id','created_by','date_created'],
                0,0,
                "date_created desc"
            ]
        )

        expenses_list.forEach((exp,idx) => {
            expenses_list[idx].id = -expenses_list[idx].id
            expenses_list[idx].amount = -expenses_list[idx].amount
        });



        const rec_transactions = [...investments_list, ...expenses_list].sort((inv, exp) => {
            return new Date(inv.date_created) - new Date(exp.date_created);
        });

        await processTransactionList(rec_transactions,this.orm)

        this.page_data.recent_transactions = rec_transactions
    }

    async get_pending_transactions(){
        const today = new Date();
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
        // Format the date as YYYY-MM-DDTHH:MM:SS (ISO 8601 format)
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

        let investments_list = await this.orm.call(
            "cpm_odoo.finance_investment_record",
            "search_read",
            [
                [
                    ['project_finance_id','=',parseInt(this.finance_id)],
                    ['date_created','>=',thirtyDaysAgoStr],
                    ['status','=','pending']
                ],
                ['id','title','description','amount','cur_id','status','investor_id','created_by','date_created'],
                0,0,
                "date_created desc"
            ]
        )
        
        let expenses_list = await this.orm.call(
            "cpm_odoo.finance_expense_record",
            "search_read",
            [
                [
                    ['project_finance_id','=',parseInt(this.finance_id)],
                    ['date_created','>=',thirtyDaysAgoStr],
                    ['status','=','pending']
                ],
                ['id','title','description','amount','cur_id','status','category_id','created_by','date_created'],
                0,0,
                "date_created desc"
            ]
        )

        expenses_list.forEach((exp,idx) => {
            expenses_list[idx].amount = -expenses_list[idx].amount
        });

        const rec_transactions = [...investments_list, ...expenses_list].sort((inv, exp) => {
            return new Date(inv.date_created) - new Date(exp.date_created);
        });

        await processTransactionList(rec_transactions,this.orm)

        this.page_data.pending_transactions = rec_transactions
    }

    async loadData(){
        this.get_recent_transactions()
        this.get_pending_transactions()
    }
}

class FinanceBudgetsTab extends Component {
    static template = "cpm_odoo.FinanceBudgetsTab"

    setup(){
        this.finance_id = this.props.context_data.finance_id

        this.page_data = useState({
            total_investments : 0,
            total_expenses : 0,
            current_budget: 0
        })

        this.orm = useService("orm")
        this.action = useService("action")

        this.loadData()
    }

    async loadData(){

    }

    async act_add_investment_record(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Investment Record',
            res_model: 'cpm_odoo.finance_investment_record',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_project_finance_id': this.finance_id },  // Optional: default values for fields
        });
    }

    async act_add_expense_record(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Expense Record',
            res_model: 'cpm_odoo.finance_expense_record',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_project_finance_id': this.finance_id },  // Optional: default values for fields
        });
    }
}

class FinanceInvestorsTab extends Component {
    static template = "cpm_odoo.FinanceInvestorsTab"
}

export class ProjectFinancePage extends Component {
    static template = "cpm_odoo.ProjectFinancePage"
    static components = {
        ProjectFinanceDashboardTab,
        FinanceBudgetsTab
    }
    static page_name

    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        {
            id:"dashboard",
            name:"Dashboard",
            page:ProjectFinanceDashboardTab,
            group_id:""
        },
        {
            id:"budgets",
            name:"Budgets",
            page:FinanceBudgetsTab,
            group_id:""
        },
        {
            id:"investors",
            name:"Investors",
            page:FinanceInvestorsTab,
            group_id:""
        }
    ]

    setup(){
        this.currentPage = getPageContext().subpage_id;
        if (this.currentPage == null){
            this.currentPage=this.constructor.availablePages[0].id
        }
        
    }


    async callSubPage(id) {
        moveToPage(false,id)
    }
}