/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo, joinDatas, joinM2MDatas, formatSnakeStr} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

class RiskAndSafetyPage extends ItemList{
    static page_name='cpm_odoo.RiskAndSafetyPage'
    static template="cpm_odoo.RiskAndSafetyPage"
    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    

    setup(){
        this.props.extra_domain=[
            ['project_id','=',this.props.context_data.project_id],
            // ['status','=','not_resolved']
        ]
        super.init()

        this.page_data.model_name = "cpm_odoo.risk_mgmt"
        this.page_data.column_list = []
        this.page_data.order_by_str = "created_at asc, name asc"
        this.page_data.join_cols = [
            ['category_id','cpm_odoo.risk_mgmt_category',['id','name','color']]
        ]

        this.search_filter.search_bar.cols=['title']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])
        
        this.filter_data = [
            {
                col_name:"category_id",
                item_list:[]
            },
            {
                col_name:"probability",
                item_list:[
                    {
                        id:'low',
                        name:"Low"
                    },
                    {
                        id:'medium',
                        name:"Medium"
                    },
                    {
                        id:'high',
                        name:"High"
                    }
                ]
            },
            {
                col_name:"impact",
                item_list:[
                    {
                        id:'low',
                        name:"Low"
                    },
                    {
                        id:'medium',
                        name:"Medium"
                    },
                    {
                        id:'high',
                        name:"High"
                    }
                ]
            }
        ]

        this.action=useService("action")

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.risk_mgmt_category",
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

    async act_create_risk(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Risk',
            res_model: 'cpm_odoo.risk_mgmt',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_project_id':this.props.context_data.project_id
            }
        });
    }

    async act_view_solutions(id){
        let result = await this.orm.call(
            "cpm_odoo.risk_mgmt",
            "action_view_solutions",
            [
                id
            ]
        )
        if(result){
            result.target="new"
            result = await this.action.doAction(result)
        }
    }

    async act_view_risk(id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'View Risk',
            res_model: 'cpm_odoo.risk_mgmt',
            res_id:id,
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'act_type':'view'
            }
        });
    }

    async act_edit_risk(id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Edit Risk Info',
            res_model: 'cpm_odoo.risk_mgmt',
            res_id:id,
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{

            }
        });
    }

    async act_delete_risk(id){
        if(!confirm("Delete Risk?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.risk_mgmt",
            "unlink",
            [
                id
            ]
        )
        if (result){
            window.location.reload()
        }
    }
}

class ProjectIssuesPage extends ItemList{
    static page_name='cpm_odoo.ProjectIssuesPage'
    static template="cpm_odoo.ProjectIssuesPage"
    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    

    setup(){
        this.props.extra_domain=[
            ['project_id','=',this.props.context_data.project_id],
            // ['status','=','not_resolved']
        ]
        super.init()

        this.page_data.model_name = "cpm_odoo.risk_mgmt_issue"
        this.page_data.column_list = []
        this.page_data.order_by_str = "created_at asc, title asc"
        this.page_data.join_cols = [
            ['category_id','cpm_odoo.risk_mgmt_issue_category',['id','name','color']],
            ['staff_id','cpm_odoo.human_res_staff',['id','name']]
        ]

        this.search_filter.search_bar.cols=['title']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])
        
        this.filter_data = [
            {
                col_name:"category_id",
                item_list:[]
            },
            {
                col_name:"level",
                item_list:[
                    {
                        id:'minor',
                        name:'Minor'
                    },
                    {
                        id:'moderate',
                        name:'Moderate'
                    },
                    {
                        id:'major',
                        name:'Major'
                    },
                    {
                        id:'critical',
                        name:'Critical'
                    }
                ]
            },
            {
                col_name:"status",
                item_list:[
                    {
                        id:'not_resolved',
                        name:"Not Resolved"
                    },
                    {
                        id:'in_progress',
                        name:"In Progress"
                    },
                    {
                        id:'resolved',
                        name:"Resolved"
                    }
                ]
            }
        ]

        this.action=useService("action")

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.risk_mgmt_issue_category",
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

    async act_create_task_issue(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Issue',
            res_model: 'cpm_odoo.risk_mgmt_issue',
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{
                'default_project_id':this.props.context_data.project_id
            }
        });
    }

    async act_mark_resolved(id){
        if(!confirm("Mark As Resolved?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.risk_mgmt_issue",
            "action_resolved",
            [
                id
            ]
        )
        if (result){
            window.location.reload()
        }
    }

    async act_mark_verified(id){
        if(!confirm("Mark As Verified?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.risk_mgmt_issue",
            "action_in_progress",
            [
                id
            ]
        )
        if (result){
            window.location.reload()
        }
    }

    async act_edit_issue(id){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Issue',
            res_model: 'cpm_odoo.risk_mgmt_issue',
            res_id:id,
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context:{

            }
        });
    }

    async act_delete_issue(id){
        if(!confirm("Delete Issue?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.risk_mgmt_issue",
            "unlink",
            [
                id
            ]
        )
        if (result){
            window.location.reload()
        }
    }
}

export class RiskIssuesUI extends Component{
    static page_name='cpm_odoo.RiskIssuesUI'
    static template="cpm_odoo.RiskIssuesUI"
    static components = {
        RiskAndSafetyPage,
        ProjectIssuesPage
    };
    
    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        {
            id:RiskAndSafetyPage.page_name,
            name:"Project Risks and Safety",
            page:RiskAndSafetyPage,
            group_id:""
        },
        {
            id:ProjectIssuesPage.page_name,
            name:"Project Issues",
            page:ProjectIssuesPage,
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