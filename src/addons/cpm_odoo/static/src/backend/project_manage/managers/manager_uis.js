/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo, joinDatas, joinM2MDatas, formatSnakeStr} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

class ManagerOverviewPage extends Component{
    static page_name='cpm_odoo.ManagerOverviewPage'
    static template="cpm_odoo.ManagerOverviewPage"

}

class FinanceManagerPage extends ItemList{
    static page_name='cpm_odoo.FinanceManagerPage'
    static template="cpm_odoo.FinanceManagerPage"

    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        super.init()

        this.page_data.get_func="act_get_finance_managers"
        this.page_data.get_func_params=[this.props.context_data.project_id]
        this.page_data.model_name = "cpm_odoo.root_project"
        this.page_data.column_list = ['id','name','email','department_id']
        this.page_data.order_by_str = "name asc"
        this.page_data.join_cols = [
            ['department_id','cpm_odoo.planning_workflow',['id','name']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")

        // this.filter_data=[
        //     {
        //         col_name:"priority",
        //         item_list:[
        //             {
        //                 id:"normal",
        //                 name:"Normal"
        //             },
        //             {
        //                 id:"low",
        //                 name:"Low"
        //             },
        //             {
        //                 id:"medium",
        //                 name:"Medium"
        //             },
        //             {
        //                 id:"high",
        //                 name:"High"
        //             },
        //             {
        //                 id:"critical",
        //                 name:"Critical"
        //             }
        //         ]
        //     }
        // ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()

        this.manager_list = await this.orm.call(
            "cpm_odoo.root_project",
            "act_get_finance_managers",
            [
                this.props.context_data.project_id
            ]
        )
    }

    async loadFilterData(){
        
    }

    async act_add_manager(){
        let view_id = await this.orm.call(
            "cpm_odoo.root_project",
            "get_model_view_id",
            [
                "cpm_odoo.human_res_staff_manager_assign_view_tree"
            ]
        )

        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Add Manager',
            res_model: 'cpm_odoo.human_res_staff',
            view_mode: 'tree',
            views: [[view_id, 'tree']],
            target: 'new',
            context:{
                'action_model_name':'cpm_odoo.root_project',
                'action_model_func':'act_add_finance_manager',
                'action_model_params':[this.props.context_data.project_id],
                'domain':[['id','not in',]]
            }
        });
    }
}

export class ProjectManagerUI extends Component{
    static page_name='cpm_odoo.ProjectManagerUI'
    static template="cpm_odoo.ProjectManagerUI"
    static components = {
        ManagerOverviewPage,
        FinanceManagerPage
    };
    
    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        {
            id:ManagerOverviewPage.page_name,
            name:"Overview",
            page:ManagerOverviewPage,
            group_id:""
        },
        {
            id:FinanceManagerPage.page_name,
            name:"Finance Managers",
            page:FinanceManagerPage,
            group_id:""
        }
    ]

    setup(){
        this.currentPage = getPageContext().subpage_id;
        if (this.currentPage == null){
            this.currentPage=this.constructor.availablePages[0].id
        }

        this.orm=useService('orm')
        
        onWillStart(async()=>{
            await this.loadData()
        })
    }

    async loadData(){
        let project_info = await this.orm.call(
            "cpm_odoo.root_project",
            "search_read",
            [
                [
                    ['id','=',this.props.context_data.project_id]
                ],
                ['id','name','finance_group_id','planning_group_id','document_group_id','contract_group_id']
            ]
        )

        this.props.context_data.project_info = project_info
    }


    async callSubPage(id) {
        moveToPage(false,id)
    }
}