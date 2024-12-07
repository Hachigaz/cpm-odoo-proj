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
            ['department_id','cpm_odoo.human_res_department',['id','name']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")
        this.page_title = "Planning Managers"

        this.filter_data=[
            {
                col_name:"department_id",
                item_list:[]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        let manager_list = await this.orm.call(
            this.page_data.model_name,
            this.page_data.get_func,
            [
                this.props.context_data.project_id
            ]
        )

        this.manager_dep_list = manager_list.map(obj=>obj.department_id[0])
        this.manager_id_list = manager_list.map(obj => obj.id)

        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.human_res_department",
            "search_read",
            [
                [['id','in',this.manager_dep_list]],
                ["id","name"]
            ]
        )
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
            domain:[['id','not in',this.manager_id_list]],
            target: 'new',
            context:{
                'action_model_name':'cpm_odoo.root_project',
                'action_model_func':'act_add_finance_manager',
                'action_model_params':[this.props.context_data.project_id]
            }
        });
    }

    async act_remove_manager(id){
        if (!confirm("Unassign Manager?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.root_project",
            "act_remove_finance_manager",
            [
                this.props.context_data.project_id,
                id
            ]
        )
        if(result){
            window.location.reload()
        }
    }
}

class PlanningManagerPage extends ItemList{
    static page_name='cpm_odoo.PlanningManagerPage'
    static template="cpm_odoo.FinanceManagerPage"

    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        super.init()

        this.page_data.get_func="act_get_planning_managers"
        this.page_data.get_func_params=[this.props.context_data.project_id]
        this.page_data.model_name = "cpm_odoo.root_project"
        this.page_data.column_list = ['id','name','email','department_id']
        this.page_data.order_by_str = "name asc"
        this.page_data.join_cols = [
            ['department_id','cpm_odoo.human_res_department',['id','name']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")
        this.page_title = "Planning Managers"

        this.filter_data=[
            {
                col_name:"department_id",
                item_list:[]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        let manager_list = await this.orm.call(
            this.page_data.model_name,
            this.page_data.get_func,
            [
                this.props.context_data.project_id
            ]
        )

        this.manager_dep_list = manager_list.map(obj=>obj.department_id[0])
        this.manager_id_list = manager_list.map(obj => obj.id)

        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.human_res_department",
            "search_read",
            [
                [['id','in',this.manager_dep_list]],
                ["id","name"]
            ]
        )
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
            domain:[['id','not in',this.manager_id_list]],
            target: 'new',
            context:{
                'action_model_name':'cpm_odoo.root_project',
                'action_model_func':'act_add_planning_manager',
                'action_model_params':[this.props.context_data.project_id]
            }
        });
    }

    async act_remove_manager(id){
        if (!confirm("Unassign Manager?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.root_project",
            "act_remove_planning_manager",
            [
                this.props.context_data.project_id,
                id
            ]
        )
        if(result){
            window.location.reload()
        }
    }
}

class DocumentManagerPage extends ItemList{
    static page_name='cpm_odoo.DocumentManagerPage'
    static template="cpm_odoo.FinanceManagerPage"

    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        super.init()

        this.page_data.get_func="act_get_document_managers"
        this.page_data.get_func_params=[this.props.context_data.project_id]
        this.page_data.model_name = "cpm_odoo.root_project"
        this.page_data.column_list = ['id','name','email','department_id']
        this.page_data.order_by_str = "name asc"
        this.page_data.join_cols = [
            ['department_id','cpm_odoo.human_res_department',['id','name']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")
        this.page_title = "Document Managers"

        this.filter_data=[
            {
                col_name:"department_id",
                item_list:[]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        let manager_list = await this.orm.call(
            this.page_data.model_name,
            this.page_data.get_func,
            [
                this.props.context_data.project_id
            ]
        )

        this.manager_dep_list = manager_list.map(obj=>obj.department_id[0])
        this.manager_id_list = manager_list.map(obj => obj.id)

        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.human_res_department",
            "search_read",
            [
                [['id','in',this.manager_dep_list]],
                ["id","name"]
            ]
        )
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
            domain:[['id','not in',this.manager_id_list]],
            target: 'new',
            context:{
                'action_model_name':'cpm_odoo.root_project',
                'action_model_func':'act_add_document_manager',
                'action_model_params':[this.props.context_data.project_id]
            }
        });
    }

    async act_remove_manager(id){
        if (!confirm("Unassign Manager?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.root_project",
            "act_remove_document_manager",
            [
                this.props.context_data.project_id,
                id
            ]
        )
        if(result){
            window.location.reload()
        }
    }
}

class QAManagerPage extends ItemList{
    static page_name='cpm_odoo.QAManagerPage'
    static template="cpm_odoo.FinanceManagerPage"

    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        super.init()

        this.page_data.get_func="act_get_qa_managers"
        this.page_data.get_func_params=[this.props.context_data.project_id]
        this.page_data.model_name = "cpm_odoo.root_project"
        this.page_data.column_list = ['id','name','email','department_id']
        this.page_data.order_by_str = "name asc"
        this.page_data.join_cols = [
            ['department_id','cpm_odoo.human_res_department',['id','name']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")
        this.page_title = "Project QAs"

        this.filter_data=[
            {
                col_name:"department_id",
                item_list:[]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        let manager_list = await this.orm.call(
            this.page_data.model_name,
            this.page_data.get_func,
            [
                this.props.context_data.project_id
            ]
        )

        this.manager_dep_list = manager_list.map(obj=>obj.department_id[0])
        this.manager_id_list = manager_list.map(obj => obj.id)

        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.human_res_department",
            "search_read",
            [
                [['id','in',this.manager_dep_list]],
                ["id","name"]
            ]
        )
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
            domain:[['id','not in',this.manager_id_list]],
            target: 'new',
            context:{
                'action_model_name':'cpm_odoo.root_project',
                'action_model_func':'act_add_qa_manager',
                'action_model_params':[this.props.context_data.project_id]
            }
        });
    }

    async act_remove_manager(id){
        if (!confirm("Unassign Manager?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.root_project",
            "act_remove_qa_manager",
            [
                this.props.context_data.project_id,
                id
            ]
        )
        if(result){
            window.location.reload()
        }
    }
}

class ContractManagerPage extends ItemList{
    static page_name='cpm_odoo.ContractManagerPage'
    static template="cpm_odoo.FinanceManagerPage"

    static components = {
        SearchBar,
        ListFilter
    }
    
    static formatSnakeStr = formatSnakeStr
    static formatDateTime = formatDateTime
    

    setup(){
        super.init()

        this.page_data.get_func="act_get_contract_managers"
        this.page_data.get_func_params=[this.props.context_data.project_id]
        this.page_data.model_name = "cpm_odoo.root_project"
        this.page_data.column_list = ['id','name','email','department_id']
        this.page_data.order_by_str = "name asc"
        this.page_data.join_cols = [
            ['department_id','cpm_odoo.human_res_department',['id','name']]
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action=useService("action")
        this.page_title = "Contract Managers"

        this.filter_data=[
            {
                col_name:"department_id",
                item_list:[]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        let manager_list = await this.orm.call(
            this.page_data.model_name,
            this.page_data.get_func,
            [
                this.props.context_data.project_id
            ]
        )

        this.manager_dep_list = manager_list.map(obj=>obj.department_id[0])
        this.manager_id_list = manager_list.map(obj => obj.id)

        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.human_res_department",
            "search_read",
            [
                [['id','in',this.manager_dep_list]],
                ["id","name"]
            ]
        )
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
            domain:[['id','not in',this.manager_id_list]],
            target: 'new',
            context:{
                'action_model_name':'cpm_odoo.root_project',
                'action_model_func':'act_add_contract_manager',
                'action_model_params':[this.props.context_data.project_id]
            }
        });
    }

    async act_remove_manager(id){
        if (!confirm("Unassign Manager?")){
            return
        }
        let result = await this.orm.call(
            "cpm_odoo.root_project",
            "act_remove_contract_manager",
            [
                this.props.context_data.project_id,
                id
            ]
        )
        if(result){
            window.location.reload()
        }
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
        },
        {
            id:PlanningManagerPage.page_name,
            name:"Planning Managers",
            page:PlanningManagerPage,
            group_id:""
        },
        {
            id:DocumentManagerPage.page_name,
            name:"Document Managers",
            page:DocumentManagerPage,
            group_id:""
        },
        {
            id:ContractManagerPage.page_name,
            name:"Contract Managers",
            page:ContractManagerPage,
            group_id:""
        },
        {
            id:QAManagerPage.page_name,
            name:"Project QAs",
            page:QAManagerPage,
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