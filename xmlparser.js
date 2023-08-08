class XMLParser {
    /**
     * Parses the XML string to an object.
     * @param {string} xmlString 
     * @param {string} type 
     * @returns 
     */
    Parse(xmlString, type) {
        let XML = this.GetXMLStartString(xmlString, type)
        let object = {}, jsObject = {}
        let data = [], jsArray = [], jsObjectData = []
        let convertedData = {}
        let multipleColumnName = ""
        let ran = false
        let i = 0, currentParentNumber = 0, objLength = 0, parentElementNumber = XML.item(0).children.length
        for(let parent of XML.item(0).children){
            if(this.HasChildren(parent)){
                for(let children of parent.children){
                    if(!ran){
                        jsArray = this.SetJSObjectProperties(parent.children, jsObject)
                        if(Object.keys(jsArray).length > 0){
                            const propertyName = Object.keys(jsArray)
                            objLength = Object.keys(jsArray[propertyName]).length
                        }
                    }
                    if(objLength > 0){
                        if(i == objLength -1){
                            jsObjectData.push(jsArray)
                            jsArray = []
                            i = 0
                            continue
                        }
                        i++
                        continue
                    }
                    let currentElement = parent.children.item(i)
                    if(children.children.length === 0){
                        jsObject[currentElement.nodeName] = currentElement.innerHTML
                    }else{
                        if(multipleColumnName !== children.nodeName){
                            multipleColumnName = children.nodeName
                            object = this.DrillDown(children, object) 
                            data.push(object)
                        }else{
                            object = this.DrillDown(children, object) 
                            data.push(object)
                        }
                        object = {}
                    }
                    i++
                    if(i === parent.children.length){
                        if(multipleColumnName != "") {
                            jsObject[multipleColumnName] = data
                        }
                        jsObjectData.push(jsObject)
                        jsObject = {}
                        data = []
                        i = 0
                    }
                }
            }else{
                jsObject[parent.nodeName] = parent.innerHTML
                let hasTreeDrillDown = false
                if(i === 0){
                    hasTreeDrillDown = this.HasTreeDrillDown(XML.item(0).children)
                }
                if(!hasTreeDrillDown){
                    if(i === parentElementNumber - 1){
                        return jsObject
                    }
                }
                i++
            }
            if(currentParentNumber === parentElementNumber - 1){                
                let xmlBody = {}
                xmlBody[parent.nodeName] = jsObjectData
                convertedData[XML.item(0).nodeName] = xmlBody
                return convertedData

            }
            currentParentNumber++    
        }                

}
/**
 * Sets properties to the object.
 * @param {*} element 
 * @param {{}} object 
 * @returns 
 */
SetJSObjectProperties(element) {
    const childrenNumber = element.length
    let i = 0
    let properties = []
    let propertyItemValue = []
    let duplicatePropertyName = ""

    for (let children of element) {
        if (children.children.length === 0) {
            const nextSibling = element.item(i !== childrenNumber - 1 ? i + 1 : i)
            if (nextSibling && children.nodeName === nextSibling.nodeName) {
                properties.push({ name: children.nodeName, data: children.innerHTML })
            }
        }
        i++
    }
    const lookup = properties.reduce((a, e) => { a[e.name] = ++a[e.name] || 0; return a; }, {})
    if (lookup.item > 0) {
        const duplicates = properties.filter(e => lookup[e.name])
        for (let item of duplicates) {
            duplicatePropertyName = item.name
            propertyItemValue.push(item.data)
        }
        const duplicateObject = {}
        duplicateObject[duplicatePropertyName] = propertyItemValue
        
        return duplicateObject
    }

    return {}
}


    HasChildren = element => element.children.length > 0

    HasTreeDrillDown = children => {
        const tree = [{hasChildren: false, children: []}]
        let treeIndex = 0
        for(let currentChildren of children){
            if(this.HasChildren(currentChildren)){
                tree[treeIndex].children = true
                tree[treeIndex].children.push(currentChildren)

            } else{
                tree[treeIndex].children = false
            }
        }

        return tree.some(c => c.hasChildren)
    }

    DrillDown = (parent = new Element(), object) => {
        let data = []
        let multipleColumnName = ""
        let i = 0
        let row = {};
        for(let children of parent.children){
            if(this.HasChildren(children)){
            for(let childrenNodes of children.children){
            row[childrenNodes.nodeName] = childrenNodes.innerHTML
        }
        data.push(row)
        row = {}   
    } else{
        
        object[children.nodeName] = children.innerHTML
        multipleColumnName = parent.nodeName
        i++
    }
    
}
    object[multipleColumnName] = data
    return object
    
}
/**
 * Checks if the provided XML string has a header.
 * @param {string} xmlString 
 * @returns 
 */
HasHeader = xmlString => xmlString.substring(0, 13) === "<?xml version"

GetXMLStartString = (xmlString, type) =>{
    let XML = xmlString
    if(this.HasHeader(xmlString)){
        XML = xmlString.substring(xmlString.indexOf("?>") + 2).trim();
    } 
    const firstCharacter = XML.indexOf("<") + 1
    const lastCharacter = XML.indexOf(">")
    const parent = XML.substring(firstCharacter, lastCharacter)
    const parser = new DOMParser()
    const xmlDocument = parser.parseFromString(xmlString, type)
    const XMLTree = xmlDocument.getElementsByTagName(parent)
    return XMLTree
} 
/**
 * Converts a XML string to JSON string
 * @param {string} xmlString 
 * @returns
 */
ConvertXMLToJSON = (xmlString, type) =>  JSON.stringify(this.Parse(xmlString, type))
/**
 * 
 * @param {string} jsonString 
 */
ConvertJSONToXML = (jsonString) => {
    const XML = [];
    const root = document.createElement('root')
    this.GenerateXMLTree(JSON.parse(jsonString), root)
    XML.push(root)
    return new XMLSerializer().serializeToString(XML[0])
}
     
/**
 * 
 * @param {{}} json 
 * @param {HTMLElement} root 
 */
GenerateXMLTree = (json, root) => {
    let element
    for (const key in json) {
        if (json.hasOwnProperty(key)) {
          if (typeof json[key] === 'object') {
            if(isNaN(parseInt(key))){
                element = document.createElement(key)
            } else{
                element = document.createElement("item")
            }
            root.appendChild(element)
            this.GenerateXMLTree(json[key], element)
          } else {
            const element = document.createElement(key)
            const node = document.createTextNode(json[key])
            element.appendChild(node)
            root.appendChild(element)
          }
        }
      }
}


}
