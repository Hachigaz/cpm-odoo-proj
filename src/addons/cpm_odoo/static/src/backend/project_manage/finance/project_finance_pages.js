/** @odoo-module **/
import { GanttDisplay, ItemList, ListFilter, SearchBar} from "../../components/components";
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
            pending_transactions: [],
            inv_recs_by_month:[],
            exp_recs_by_month:[],
            inv_vs_rec_by_month:[],
            cur_id: null,
            pending_transaction_count:0,
            urgent_pending_transaction_count:0
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
        await this.getInvestmentvsExepenseChartData()

        let ctx = document.querySelector("#finance-overview-section #total-investments-chart .chart").getContext('2d');

        this.charts.totalInvestmentsChart = new Chart(ctx, {
            type: 'pie',  // Specify the chart type
            data: {
                labels: this.page_data.total_investments_data.map(item=>{return item.investor_id.name}),  // Add labels for the segments
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


        const inv_recs = this.page_data.inv_recs_by_month
        const exp_recs = this.page_data.exp_recs_by_month

        let minInvDate = null
        let minExpDate = null

        let maxInvDate = null
        let maxExpDate = null

        if(inv_recs.length>0){
            minInvDate = new Date(inv_recs[0]['date_created:month'])
            maxInvDate = new Date(inv_recs[inv_recs.length-1]['date_created:month'])
        }
        if(exp_recs.length>0){
            minExpDate = new Date(exp_recs[0]["date_created:month"])
            maxExpDate = new Date(exp_recs[exp_recs.length-1]["date_created:month"])
        }

        let minDate = null
        if(minInvDate){
            minDate = minInvDate
        }
        else if(minExpDate){
            minDate = minExpDate
        }
        else if(minInvDate && minExpDate){
            minDate = minInvDate<minExpDate?minInvDate:minExpDate
        }

        let maxDate = null

        if(maxInvDate){
            maxDate = maxInvDate
        }
        else if(maxExpDate){
            maxDate = maxExpDate
        }
        else if(maxInvDate && maxExpDate){
            maxDate = maxInvDate<maxExpDate?maxInvDate:maxExpDate
        }
        
        if(minDate && maxDate){
            while (minDate <= maxDate) {
                const monthYear = minDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                this.page_data.inv_vs_rec_by_month.push(
                    {
                        date:monthYear,
                        'inv_rec': inv_recs.find(rec=>rec['date_created:month']=monthYear),
                        'exp_rec': exp_recs.find(rec=>rec['date_created:month']=monthYear)
                    });
                
                minDate.setMonth(minDate.getMonth() + 1);
            }
    
            var investmentScaleFactor = 1;
            var expensesScaleFactor = 1;
    
    
            ctx = document.querySelector("#rve-section #investment-vs-expense-chart .chart").getContext('2d');
            this.charts.investment_vs_expense_chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: this.page_data.inv_vs_rec_by_month.map(item=>item.date), // time intervals
                    datasets: [
                        {
                            label: 'Total Investment By Month',
                            data: this.page_data.inv_vs_rec_by_month.map(item=>item.inv_rec.amount/investmentScaleFactor),
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Total Expense By Month',
                            data: this.page_data.inv_vs_rec_by_month.map(item=>-item.exp_rec.amount/expensesScaleFactor),
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true
                }
            });
        }
    }

    async getTotalInvestmentsChartData(){

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
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])
        
        tot_inv_data.forEach((rec,idx)=>{
            tot_inv_data[idx]["d_total_investments"] = formatCurrency(rec.total_investments,rec.cur_id)
        })

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
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])
        
        tot_exp_data.forEach((rec,idx)=>{
            tot_exp_data[idx]["d_total_expenses"] = formatCurrency(rec.total_expenses,rec.cur_id)
        })

        if(tot_exp_data.length>0){
            this.page_data.total_expenses_data = tot_exp_data;
        }
    }
    
    async getInvestmentvsExepenseChartData(){
        let inv_recs = await this.orm.call(
            "cpm_odoo.finance_investment_record",
            "read_group",
            [
                [
                    ['project_finance_id','=',this.finance_id],
                ],
                ['amount:sum','date_created','cur_id'],
                ['date_created:month','cur_id'],
                0,0,[],false
            ]
        )

        await joinDatas(inv_recs,this.orm,[
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])

        for (const [idx,rec] of inv_recs.entries()){
            if(rec.cur_id.symbol != this.page_data.cur_id.symbol){
                inv_recs[idx].amount = rec.amount * (this.page_data.cur_id.rate/rec.cur_id.rate)
            }
            inv_recs[idx].d_amount = formatCurrency(rec.amount,this.page_data.cur_id)
        }

        let exp_recs = await this.orm.call(
            "cpm_odoo.finance_expense_record",
            "read_group",
            [
                [
                    ['project_finance_id','=',this.finance_id],
                ],
                ['amount:sum','date_created','cur_id'],
                ['date_created:month','cur_id'],
                0,0,[],false
            ]
        )

        await joinDatas(exp_recs,this.orm,[
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])

        for (const [idx,rec] of exp_recs.entries()){
            if(rec.cur_id.symbol != this.page_data.cur_id.symbol){
                exp_recs[idx].amount = rec.amount * (parseFloat(this.page_data.cur_id.rate)/parseFloat(rec.cur_id.rate))
            }
            exp_recs[idx].d_amount = formatCurrency(rec.amount,this.page_data.cur_id)
        }
        
        await joinDatas(exp_recs,this.orm,[
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])


        this.page_data.inv_recs_by_month = inv_recs
        this.page_data.exp_recs_by_month = exp_recs
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


        await joinDatas(investments_list,this.orm,[
            ["investor_id","cpm_odoo.stakeholders_investor",["id","name"]]
        ])
        
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

        await joinDatas(expenses_list,this.orm,[
            ["category_id","cpm_odoo.finance_expense_category",["id","name"]]
        ])

        expenses_list.forEach((exp,idx) => {
            expenses_list[idx].id = -expenses_list[idx].id
            expenses_list[idx].amount = -expenses_list[idx].amount
        });



        const rec_transactions = [...investments_list, ...expenses_list].sort((inv, exp) => {
            return new Date(inv.date_created) - new Date(exp.date_created);
        });

        processTransactionList(rec_transactions)

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

        await joinDatas(investments_list,this.orm,[
            ["investor_id","cpm_odoo.stakeholders_investor",["id","name"]]
        ])
        
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

        await joinDatas(expenses_list,this.orm,[
            ["category_id","cpm_odoo.finance_expense_category",["id","name"]]
        ])

        const rec_transactions = [...investments_list, ...expenses_list].sort((inv, exp) => {
            return new Date(inv.date_created) - new Date(exp.date_created);
        });

        processTransactionList(rec_transactions)

        this.page_data.pending_transactions = rec_transactions
    }

    async loadData(){
        this.get_recent_transactions()
        this.get_pending_transactions()

        
        let finance_rec = await this.orm.call(
            "cpm_odoo.root_project_finance",
            "search_read",
            [
                [
                    ['id','=',this.finance_id],
                ],
                ['total_investments','total_expenses','cur_id'],
                0,1,
                ""
            ]
        )

        await joinDatas(finance_rec,this.orm,[
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])

        this.page_data.total_investments_value = finance_rec[0].total_investments
        this.page_data.total_expenses_value = finance_rec[0].total_expenses
        this.page_data.cur_id = finance_rec[0].cur_id

        let urgent_pending_transaction_count = 0
        urgent_pending_transaction_count += await this.orm.call(
            "cpm_odoo.finance_expense_record",
            "search_count",
            [
                [
                    ["project_finance_id",'=',this.finance_id],
                    ['is_urgent','=',true],
                    ['status','=','pending']
                ]
            ]
        )
        this.page_data.urgent_pending_transaction_count = urgent_pending_transaction_count

        let pending_transaction_count = 0
        pending_transaction_count += await this.orm.call(
            "cpm_odoo.finance_expense_record",
            "search_count",
            [
                [
                    ["project_finance_id",'=',this.finance_id],
                    ['is_urgent','=',false],
                    ['status','=','pending']
                ]
            ]
        )
        pending_transaction_count += await this.orm.call(
            "cpm_odoo.finance_investment_record",
            "search_count",
            [
                [
                    ["project_finance_id",'=',this.finance_id],
                    ['status','=','pending']
                ]
            ]
        )
        this.page_data.pending_transaction_count = pending_transaction_count
    }
}

class FinanceInvestmentItemList extends ItemList{
    static template = "cpm_odoo.FinanceInvestmentItemList"
    static components = {
        SearchBar,
        ListFilter
    }
    static formatDateTime = formatDateTime
    static formatCurrency = formatCurrency
    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.finance_investment_record"
        this.page_data.column_list = ['id','title','description','amount','cur_id','investor_id','date_created','created_by','status']//columns to get from model
        this.page_data.order_by_str = "date_created asc"
        this.page_data.join_cols =[
            ["investor_id","cpm_odoo.stakeholders_investor",["id","name"]],
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ]
        this.search_filter.search_bar.cols=["title"]
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action = useService("action")
        
        this.filter_data = [
            {
                col_name:"investor_id",
                item_list:[]
            }
        ]

        this.loadData()
        
        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        let inv_ids = (await this.orm.call(
            "cpm_odoo.project_investor_investment_record",
            "search_read",
            [
                [
                    ["project_finance_id","=",this.props.finance_id]
                ],
                ["investor_id"],
                0,0,""
            ]
        )).map(obj=>obj.investor_id[0])
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.stakeholders_investor",
            "search_read",
            [
                [
                    ['id','in',inv_ids]
                ],
                [
                    "id","name"
                ],
                0,0,
                "name asc"
            ]
        )
    }
}

class FinanceExpenseItemList extends ItemList{
    static template = "cpm_odoo.FinanceExpenseItemList"
    static components = {
        SearchBar,
        ListFilter
    }
    static formatDateTime = formatDateTime
    static formatCurrency = formatCurrency
    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.finance_expense_record"
        this.page_data.column_list = ['id','title','description','amount','cur_id','category_id',"is_urgent",'date_created','created_by','status']//columns to get from model
        this.page_data.order_by_str = "date_created asc"
        this.page_data.join_cols =[
            ["category_id","cpm_odoo.finance_expense_category",["id","name"]],
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ]
        this.search_filter.search_bar.cols=["title"]
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action = useService("action")
        
        this.filter_data = [
            {
                col_name:"category_id",
                item_list:[]
            }
        ]

        this.loadData()
        
        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.finance_expense_category",
            "search_read",
            [
                [

                ],
                [
                    "id","name"
                ],
                0,0,
                "name asc"
            ]
        )
    }
}

class FinanceBudgetsTab extends Component {
    static template = "cpm_odoo.FinanceBudgetsTab"
    static components = {
        FinanceInvestmentItemList,
        FinanceExpenseItemList
    }

    setup(){
        this.finance_id = this.props.context_data.finance_id

        this.page_data = useState({
            total_investments : 0,
            total_expenses : 0,
            current_budget: 0,
            cur_id: null
        })

        this.orm = useService("orm")
        this.action = useService("action")

        this.loadData()
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

        await joinDatas(investments_list,this.orm,[
            ["investor_id","cpm_odoo.stakeholders_investor",["id","name"]]
        ])
        
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

        await joinDatas(expenses_list,this.orm,[
            ["category_id","cpm_odoo.finance_expense_category",["id","name"]]
        ])

        expenses_list.forEach((exp,idx) => {
            expenses_list[idx].id = -expenses_list[idx].id
            expenses_list[idx].amount = -expenses_list[idx].amount
        });


        const rec_transactions = [...investments_list, ...expenses_list].sort((inv, exp) => {
            return new Date(inv.date_created) - new Date(exp.date_created);
        });

        processTransactionList(rec_transactions)

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

        await joinDatas(investments_list,this.orm,[
            ["investor_id","cpm_odoo.stakeholders_investor",["id","name"]]
        ])

        await joinDatas(expenses_list,this.orm,[
            ["category_id","cpm_odoo.finance_expense_category",["id","name"]]
        ])

        expenses_list.forEach((exp,idx) => {
            expenses_list[idx].amount = -expenses_list[idx].amount
        });

        const rec_transactions = [...investments_list, ...expenses_list].sort((inv, exp) => {
            return new Date(inv.date_created) - new Date(exp.date_created);
        });

        processTransactionList(rec_transactions)

        this.page_data.pending_transactions = rec_transactions
    }

    async loadData(){
        this.get_recent_transactions()
        this.get_pending_transactions()

        
        let finance_rec = await this.orm.call(
            "cpm_odoo.root_project_finance",
            "search_read",
            [
                [
                    ['id','=',this.finance_id],
                ],
                ['total_investments','total_expenses','cur_id'],
                0,1,
                ""
            ]
        )
        await joinDatas(finance_rec,this.orm,[
            ["cur_id","res.currency",["id","symbol","position","decimal_places","rate"]]
        ])

        this.page_data.cur_id = finance_rec[0].cur_id
        this.page_data.total_investments_value = finance_rec[0].total_investments
        this.page_data.total_expenses_value = finance_rec[0].total_expenses
    }

    static formatCurrency = formatCurrency

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