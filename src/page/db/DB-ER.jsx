import React, {useState, useEffect, useRef} from 'react';
import Swal from 'sweetalert2'
import {
    Autocomplete, AutocompleteItem,
    Button, Card, CardBody, Pagination,
    Select,
    SelectItem,
} from '@nextui-org/react';
import {Graph, Shape} from '@antv/x6';
import { MiniMap } from '@antv/x6-plugin-minimap'

import './DB-ER.css';

import {
    api_getTableEr,
    api_openSyncDataBaseInfo,
    api_saveTables,
    api_select,
    api_updateRelationshipLine
} from '../../util/http/api.js';
import {atom, useAtom} from "jotai";

const LINE_HEIGHT = 24;
const NODE_WIDTH = 200;
const isLoading = atom("");
// 查询条件
let findData = {
    databaseInfoId: null,
    tableId: null,
    otherTableIdIds: null,
    relationLevel: null
};


// 初始化图表
const initializeGraph = () => {

    Graph.registerPortLayout(
        'erPortPosition',
        (portsPositionArgs) => {
            return portsPositionArgs.map((_, index) => {
                return {
                    position: {
                        x: 0,
                        y: (index + 1) * LINE_HEIGHT,
                    },
                    angle: 0,
                };
            });
        },
        true
    );

    Graph.registerNode(
        'er-rect',
        {
            inherit: 'rect',
            markup: [
                {
                    tagName: 'rect',
                    selector: 'body',
                },
                {
                    tagName: 'text',
                    selector: 'label',
                },
            ],
            attrs: {
                rect: {
                    strokeWidth: 1,
                    stroke: '#5F95FF',
                    fill: '#5F95FF',
                },
                label: {
                    fontWeight: 'bold',
                    fill: '#ffffff',
                    fontSize: 12,
                },
            },
            ports: {
                groups: {
                    list: {
                        markup: [
                            {
                                tagName: 'rect',
                                selector: 'portBody',
                            },
                            {
                                tagName: 'text',
                                selector: 'portNameLabel',
                            },
                            {
                                tagName: 'text',
                                selector: 'portTypeLabel',
                            },
                        ],
                        attrs: {
                            portBody: {
                                width: NODE_WIDTH,
                                height: LINE_HEIGHT,
                                strokeWidth: 1,
                                stroke: '#5F95FF',
                                fill: '#EFF4FF',
                                magnet: true,
                            },
                            portNameLabel: {
                                ref: 'portBody',
                                refX: 6,
                                refY: 6,
                                fontSize: 10,
                            },
                            portTypeLabel: {
                                ref: 'portBody',
                                refX: 95,
                                refY: 6,
                                fontSize: 10,
                            },
                        },
                        position: 'erPortPosition',
                    },
                },
            },
        },
        true
    );

    let graph = new Graph({
        container: document.getElementById('container'),
        width: 5000,
        height: 5000,
        panning: true,
        scaling: {
            min: 0.9,
            max: 12,
        },
        connecting: {
            allowBlank: false,
            router: {
                name: 'er',
                args: {
                    offset: 25,
                    direction: 'H',
                },
            },
            createEdge() {
                return new Shape.Edge({
                    attrs: {
                        line: {
                            stroke: '#A2B1C3',
                            strokeWidth: 2,
                        },
                    },
                });
            },
        },
    });

    // 双击删除连接线
    graph.on('edge:dblclick', ({edge, view}) => {
        api_updateRelationshipLine({id: edge.store.previous.source.port, foreignKeyId: ""}).then((res) => {
            view.cell.remove()
        });
    });

    // 连接线关联后
    graph.on('edge:connected', ({edge, currentCell, view, currentPort}) => {
        console.log("开始节点:" + edge.store.previous.source.cell, edge.store.previous.source.port, "结束节点:" + currentCell.id, currentPort)
        if (currentPort === undefined) {
            view.cell.remove();
            return;
        }

        api_updateRelationshipLine({id: edge.store.previous.source.port, foreignKeyId: currentPort}).then((res) => {
            if (res.code !== 100) {
                view.cell.remove()
            }
        });
    });

    graph.use(
        new MiniMap({
            container: document.getElementById('app_minimap'),
            width: 150,
            height: 150,
            padding: 0,
        }),
    )


    return graph;
};

// 节点数据
const createTableNode = (table, tableIdMap) => ({
    id: table.id.toString(),
    shape: 'er-rect',
    label: `${table.tableDescription}-${table.label}`,
    width: 200,
    height: 24,
    position: {x: table.positionX, y: table.positionY},
    ports: table.ports.map((port) => {
        tableIdMap[port.id] = table.id;
        return {
            id: `${port.id}`,
            group: 'list',
            attrs: {
                portNameLabel: {
                    text: port.name,
                },
                portTypeLabel: {
                    text: `${port.type}-${port.desc}`,
                },
            },
        };
    }),
});


// 连接线关系数据
const createEdge = (relation, tableIdMap) => {
    const cellA = tableIdMap[relation.staNode];
    const portA = relation.staNode;
    const cellB = tableIdMap[relation.endNode];
    const portB = relation.endNode;

    return {
        id: relation.id,
        shape: 'edge',
        target: {
            cell: cellA,
            port: portA,
        },
        source: {
            cell: cellB,
            port: portB,
        },
        attrs: {
            line: {
                stroke: '#A2B1C3',
                strokeWidth: 2,
            },
        },
    };
};

/**
 * @param label 名称
 * @param selectionMode 选择模式：多选，单选-默认
 * @param datas 下拉列表的数据
 * @param findName 字段名称
 * @param isCache 是否开启缓存
 * @param onSelectionChange 选择后执行的回调方法
 * @param selectData
 * @returns {React.JSX.Element|null}
 * @constructor
 */
function MySelect({label, selectionMode, datas, findName, isCache, onSelectionChange}) {

    // 单选-默认
    if (!selectionMode) {
        selectionMode = "single"
    }

    if (!datas.length) {
        return null;
    }

    const cacheKey = 'hi_sel_' + findName;

    // Select选择后的回调
    const selectedValue = event => {
        let sVal = event ? Array.from(event).join(",") : "";

        if (findName) {
            findData[findName] = sVal;
        }

        // 回调函数，将选中的值传递给父组件
        if (onSelectionChange && typeof onSelectionChange === 'function' && sVal) {
            onSelectionChange(sVal);
        }

        // 缓存值
        if (isCache && sVal !== null && sVal !== "") {
            localStorage.setItem(cacheKey, sVal)
        }

        // if(selectData){
        //     const [localSearch, setLocalSearch] = useAtom(selectData);
        //     const handleChange = event => setLocalSearch(event.target.value);
        // }
    };

    // 缓存值
    let defKey = null;
    if (isCache) {
        let cacheData = localStorage.getItem(cacheKey);
        if (cacheData !== null) {
            defKey = cacheData;
            findData[findName] = defKey;
        }
    }

    return (
        <Select
            items={datas}
            selectionMode={selectionMode}
            label={label}
            labelPlacement="outside-left"
            placeholder="请选择"
            className="my_sel whitespace-nowrap selectol-label"
            defaultSelectedKeys={defKey}
            onSelectionChange={selectedValue}
        >
            {(data) => (
                <SelectItem key={data.k} description={data.d}>
                    {data.v}
                </SelectItem>
            )}
        </Select>
    );
}


const DbER = () => {
    const [tableData, setTableData] = useState([{"k":"","v":"","d":""}]);
    const [databaseInfoData, setDatabaseInfoData] = useState({});
    const graphRef = useRef(null);

    const [isLoadingVal] = useAtom(isLoading);

    // 将滚动条居中
    const centerScrollbar = () => {
        const erBody = document.querySelector('.er_body');
        erBody.style.overflow = 'auto';
        // 在垂直方向上居中滚动条
        erBody.scrollTop = (erBody.scrollHeight - erBody.clientHeight) / 2;
        // 在水平方向上居中滚动条
        erBody.scrollLeft = (erBody.scrollWidth - erBody.clientWidth) / 2;
    };


    // 初始化er图
    function initDbEr() {
        if (graphRef !== null && graphRef.current) {
            graphRef.current.dispose();
        }
        graphRef.current = initializeGraph();

        if (findData.tableId === null && findData.otherTableIdIds === null) {
            Swal.fire({
                position: "top-end",
                icon: "warning",
                title: "请选择库表",
                showConfirmButton: false,
                timer: 800
            });
            return;
        }

        // 获取数据库表
        api_getTableEr(findData).then((res) => {
            const cells = [];
            const tableIdMap = {};

            res.table.forEach((table) => {
                const tableNode = createTableNode(table, tableIdMap);
                cells.push(graphRef.current.createNode(tableNode));
            });

            res.relation.forEach((relation) => {
                const edge = createEdge(relation, tableIdMap);
                cells.push(graphRef.current.createEdge(edge));
            });

            graphRef.current.resetCells(cells);
            graphRef.current.zoomToFit({padding: 10, maxScale: 1});
        });

        // 当组件加载完成时调用函数
        centerScrollbar();

    }

    useEffect(() => {
        api_select({type: "dbInfo"}).then((r) => {
            setDatabaseInfoData(r)
        });
        let cacheData = localStorage.getItem("hi_sel_databaseInfoId");
        if (cacheData !== null) {
            findTable(cacheData)
        }

    }, []);


    // 保存表格事件
    const saveTables = () => {
        const graph = graphRef.current;
        if (graph) {
            const lists = graph.getNodes().map((node) => ({
                id: node.id,
                positionX: node.position().x,
                positionY: node.position().y
            }));
            api_saveTables(lists).then(() => {
            });
        }
    };

    const [localSearch, setLocalSearch] = useAtom(isLoading);

    // 同步数据库表
    function openSyncDataBaseInfo (th) {
        if (findData.databaseInfoId === "" || findData.databaseInfoId === null) {
            Swal.fire({
                position: "top-end", icon: "warning", title: "请选择库", showConfirmButton: false, timer: 800
            });
            return;
        }
        setLocalSearch( true)

        api_openSyncDataBaseInfo({id: findData.databaseInfoId}).then((res) => {
            setLocalSearch( false);
            Swal.fire({
                position: "top-end", icon: "success", title: "同步成功", showConfirmButton: false, timer: 800
            });
        })

    }


    const find = () => {
        initDbEr()
    };

    /**
     * @param relationLevel 查询出关系层级数
     */
    const findRelationLevel = (relationLevel) => {
        findData.relationLevel = relationLevel;
        initDbEr()
    };


    function findTable(selectedValue) {
        api_select({type: "table", param1: selectedValue}).then((r) => {
            setTableData(r)
        });
    }

    return (
        <>
            <div className="piv-1-10 header">
                <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
                    <MySelect label="数据库" datas={databaseInfoData} findName="databaseInfoId" isCache="true"
                              onSelectionChange={findTable}/>
                    <Autocomplete className="my_sel whitespace-nowrap"
                                  labelPlacement="outside-left"
                                  label="关系表"
                                  defaultItems={tableData}
                                  onSelectionChange={(v) => findData["tableId"] = v}
                    >
                        {(data) => (
                            <AutocompleteItem className="" key={data.k} description={data.d}>
                                {data.v}
                            </AutocompleteItem>
                        )}
                    </Autocomplete>


                    <MySelect label="其它表" selectionMode="multiple" datas={tableData} findName="otherTableIdIds"/>
                    <Button color="primary" variant="flat" onClick={find}>搜索</Button>
                    <Button size="sm" variant="flat" className="ml-a" onClick={saveTables}>保存</Button>
                    <Button size="sm" variant="flat" onClick={openSyncDataBaseInfo} isLoading={isLoadingVal}>同步数据源{isLoadingVal}</Button>
                </div>

            </div>
            <div className="er_body">
                <Pagination onChange={findRelationLevel}
                            className="fixed z-20 ml-1"
                            total={5} initialPage={3}
                            classNames={{
                                wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
                                item: "w-8 h-8 text-small rounded-none bg-transparent",
                                cursor: "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
                            }}
                />
                <Card className="app-minimap z-20">
                    <CardBody>
                        <div id="app_minimap" />
                    </CardBody>
                </Card>

                <div className="helloworld-app z-10">
                    <div id="container" className="app-content"/>
                </div>
            </div>
        </>
    );
};

export default DbER;
