const API_BASE_URL = "http://localhost:5000"; // URL base da API
let editMode = false; // Define se o formulário está em modo de edição

document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("nav a");
    const pages = document.querySelectorAll(".page");

    // Função para ocultar todas as páginas e mostrar apenas a selecionada
    function navigateTo(pageId) {
        // Ocultar todas as páginas
        pages.forEach((page) => {
            page.classList.add("hidden");
        });
    
        // Mostrar a página solicitada
        document.getElementById(pageId).classList.remove("hidden");
    
        // Atualizar os dados com base na página
        switch (pageId) {
            case "start":
                loadDashboard(); // Atualiza os dados do dashboard
                break;
            case "products":
                fetchProducts(); // Atualiza a lista de produtos
                break;
            case "stocks":
                loadProducts(); // Atualiza a lista de produtos no formulário de estoques
                loadStocks(); // Atualiza os dados de estoques
                break;
            case "sales":
                loadProductsSales(); // Atualiza os produtos disponíveis para vendas
                break;
            default:
                console.log(`Nenhuma ação definida para a página: ${pageId}`);
        }
    }

    // Adicionar evento de clique nos links
    links.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault(); // Evita o comportamento padrão do link
            const pageId = link.dataset.page; // Obtém o ID da página do atributo data-page
            navigateTo(pageId);
        });
    });

    // Exibir a página inicial por padrão
    navigateTo("start");
});

//Inicio dashboard
// Função para buscar o total de vendas
async function fetchTotalVendas() {
    try {
        const response = await fetch(`${API_BASE_URL}/vendas/total`);
        if (!response.ok) throw new Error('Erro ao buscar total de vendas');
        const data = await response.json();
        document.getElementById('valorTotalVendas').textContent = data.valor.toFixed(2);
    } catch (error) {
        console.error('Erro ao buscar total de vendas:', error.message);
    }
}

// Função para buscar o total de produtos
async function fetchTotalProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos/total`);
        if (!response.ok) throw new Error('Erro ao buscar total de produtos');
        const data = await response.json();
        document.getElementById('valorTotalProdutos').textContent = data.total;
    } catch (error) {
        console.error('Erro ao buscar total de produtos:', error.message);
    }
}

// Função para buscar o total de estoque
async function fetchTotalEstoque() {
    try {
        const response = await fetch(`${API_BASE_URL}/estoque/total`);
        if (!response.ok) throw new Error('Erro ao buscar total de estoque');
        const data = await response.json();
        document.getElementById('valorTotalEstoque').textContent = data.total;
    } catch (error) {
        console.error('Erro ao buscar total de estoque:', error.message);
    }
}

// Função para carregar os totalizadores
function loadDashboard() {
    fetchTotalVendas();
    fetchTotalProdutos();
    fetchTotalEstoque();
}

// Carrega os totalizadores ao iniciar a página
document.addEventListener('DOMContentLoaded', loadDashboard);
//Fim dashboard


//Inicio Produtos
let editProductId = null; // Armazena o ID do produto em edição

// Seleciona os elementos do formulário
const productForm = document.getElementById('productForm');
const productNameInput = document.getElementById('productName');
const productDescriptionInput = document.getElementById('productDescription');
const productPriceInput = document.getElementById('productPrice');
const productTableBody = document.getElementById('productTableBody');

// Adiciona o listener para o envio do formulário
productForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita recarregar a página
    handleProductAction();
});

// Função para listar produtos
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        const data = await response.json();
        const products = data.produtos || [];
        renderProducts(products);
    } catch (error) {
        console.error('Erro ao listar produtos:', error.message);
    }
}

// Renderiza os produtos na tabela
function renderProducts(products) {
    productTableBody.innerHTML = ''; // Limpa a tabela
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.nome}</td>
            <td>${product.descricao}</td>
            <td>R$ ${parseFloat(product.preco).toFixed(2)}</td>
            <td>${product.saldo}</td>
            <td>
                <button class="edit" onclick="editProduct(${product.id})">Editar</button>
                <button class="delete" onclick="deleteProduct(${product.id})">Excluir</button>
            </td>
        `;
        productTableBody.appendChild(row);
    });
}

// Lógica para adicionar ou atualizar um produto
async function handleProductAction() {
    if (editMode) {
        await updateProduct(editProductId);
    } else {
        await addProduct();
    }
}

// Adiciona um novo produto
async function addProduct() {
    const name = productNameInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const price = parseFloat(productPriceInput.value.replace(',', '.'));

    if (!name || !description || isNaN(price)) {
        alert('Preencha todos os campos corretamente.');
        return;
    }

    const product = { nome: name, descricao: description, preco: price };

    try {
        const response = await fetch(`${API_BASE_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Erro do servidor:', errorDetails); // Mostra detalhes do backend
            throw new Error(errorDetails.error || 'Erro ao adicionar produto');
        }

        clearFormProduct();
        fetchProducts(); // Recarrega a lista de produtos
    } catch (error) {
        console.error('Erro ao adicionar produto:', error.message);
    }
}

// Edita um produto (preenche o formulário para edição)
async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/produto?id=${productId}`);
        if (!response.ok) throw new Error('Erro ao buscar produto');
        const product = await response.json();

        // Preenche o formulário
        productNameInput.value = product.nome;
        productDescriptionInput.value = product.descricao;
        productPriceInput.value = product.preco;

        // Alterna para o modo de edição
        editMode = true;
        editProductId = productId;
        productForm.querySelector('button').textContent = 'Atualizar Produto'; // Altera o texto do botão
    } catch (error) {
        console.error('Erro ao editar produto:', error.message);
    }
}

// Atualiza um produto existente
async function updateProduct(productId) {
    const name = productNameInput.value.trim();
    const description = productDescriptionInput.value.trim();
    const price = parseFloat(productPriceInput.value);

    if (!name || !description || isNaN(price)) {
        alert('Preencha todos os campos corretamente.');
        return;
    }

    const product = { id: productId, nome: name, descricao: description, preco: price };

    try {
        const response = await fetch(`${API_BASE_URL}/produto`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });

        if (!response.ok) throw new Error('Erro ao atualizar produto');

        clearFormProduct();
        fetchProducts(); // Recarrega a lista de produtos
    } catch (error) {
        console.error('Erro ao atualizar produto:', error.message);
    }
}

// Exclui um produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/produto?id=${productId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Erro ao excluir produto');

        fetchProducts(); // Recarrega a lista de produtos
    } catch (error) {
        console.error('Erro ao excluir produto:', error.message);
    }
}

// Limpa o formulário
function clearFormProduct() {
    productNameInput.value = '';
    productDescriptionInput.value = '';
    productPriceInput.value = '';
    editMode = false;
    editProductId = null;
    productForm.querySelector('button').textContent = 'Adicionar Produto';
}

// Inicializa a página listando os produtos
fetchProducts();
// Fim produtos

//Inicio Estoque
// Seleciona os elementos do formulário
const stockForm = document.getElementById('stockForm');
const productSelect = document.getElementById('productSelect');
const invoiceNumberInput = document.getElementById('invoiceNumber');
const entryDateInput = document.getElementById('entryDate');
const quantityInput = document.getElementById('quantity');
// Seleciona o corpo da tabela de estoques
const stockTableBody = document.getElementById('stockTableBody');

let editStockId = null; // ID do estoque sendo editado


// Função para carregar os produtos no dropdown
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        const data = await response.json();
        const products = data.produtos || [];

        // Limpa as opções existentes no dropdown
        productSelect.innerHTML = '';

        // Adiciona a opção inicial vazia
        const emptyOption = document.createElement('option');
        emptyOption.value = ''; // Valor vazio
        emptyOption.textContent = 'Selecione'; // Texto visível
        emptyOption.disabled = true; // Impede seleção
        emptyOption.selected = true; // Define como a opção padrão
        productSelect.appendChild(emptyOption);          

        // Preenche o dropdown de produtos
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id; // Define o ID do produto como valor
            option.textContent = product.nome; // Mostra o nome do produto
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error.message);
    }
}

// Função para cadastrar estoque
async function addStock(event) {
    event.preventDefault(); // Evita o recarregamento da página

    if (editMode) {
        await updateStock(editStockId); // Atualiza o estoque existente
    } else {
        const produto_id = parseInt(productSelect.value);
        const numero_nota_fiscal = invoiceNumberInput.value.trim();
        const data_entrada = entryDateInput.value;
        const quantidade = parseInt(quantityInput.value);

        if (!produto_id || !numero_nota_fiscal || !data_entrada || isNaN(quantidade) || quantidade <= 0) {
            alert('Preencha todos os campos corretamente.');
            return;
        }

        const stockData = {
            produto_id,
            numero_nota_fiscal,
            data_entrada,
            quantidade,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/estoques`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockData),
            });

            if (!response.ok) {
                const errorDetails = await response.json();
                console.error('Erro do servidor:', errorDetails);
                throw new Error(errorDetails.error || 'Erro ao cadastrar estoque');
            }

            clearFormStock();
            loadStocks(); // Atualiza a tabela de estoques
        } catch (error) {
            console.error('Erro ao cadastrar estoque:', error.message);
        }
    }
}


// Função para editar estoque
async function editStock(stock) {
    // Preenche o formulário com os dados do estoque
    productSelect.value = stock.produto_id;
    invoiceNumberInput.value = stock.numero_nota_fiscal;
    entryDateInput.value = new Date(stock.data_entrada).toISOString().slice(0, 16); // Formata para datetime-local
    quantityInput.value = stock.quantidade;

    // Alterna para o modo de edição
    editMode = true;
    editStockId = stock.id;
    stockForm.querySelector('button').textContent = 'Atualizar Estoque'; // Altera o texto do botão
}

// Função para Atualizar Estoque
async function updateStock(stockId) {
    const produto_id = parseInt(productSelect.value);
    const numero_nota_fiscal = invoiceNumberInput.value.trim();
    const data_entrada = entryDateInput.value;
    const quantidade = parseInt(quantityInput.value);

    if (!produto_id || !numero_nota_fiscal || !data_entrada || isNaN(quantidade) || quantidade <= 0) {
        alert('Preencha todos os campos corretamente.');
        return;
    }

    const stockData = {
        id: stockId,
        produto_id,
        numero_nota_fiscal,
        data_entrada,
        quantidade,
    };

    try {
        const response = await fetch(`${API_BASE_URL}/estoque`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stockData),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Erro do servidor:', errorDetails);
            alert(errorDetails.message);
            throw new Error(errorDetails.error || 'Erro ao atualizar estoque');
            
        }

        clearFormStock();
        loadStocks(); // Atualiza a tabela de estoques
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error.message);
    }
}

// Função para Excluir Estoque
async function deleteStock(stockId) {
    if (!confirm('Tem certeza que deseja excluir este estoque?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/estoque?id=${stockId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Erro do servidor:', errorDetails);
            throw new Error(errorDetails.error || 'Erro ao excluir estoque');
        }

        loadStocks(); // Atualiza a tabela de estoques
    } catch (error) {
        console.error('Erro ao excluir estoque:', error.message);
    }
}



// Função para carregar estoques e preencher a tabela
async function loadStocks() {
    try {
        const response = await fetch(`${API_BASE_URL}/estoques`);
        if (!response.ok) throw new Error('Erro ao buscar estoques');
        const data = await response.json();
        const stocks = data.estoques || [];

        // Carrega os produtos para mapear `produto_id` com o nome do produto
        const productsResponse = await fetch(`${API_BASE_URL}/produtos`);
        if (!productsResponse.ok) throw new Error('Erro ao buscar produtos');
        const productsData = await productsResponse.json();
        const productsMap = new Map();
        productsData.produtos.forEach(product => {
            productsMap.set(product.id, product.nome); // Mapeia produto_id para nome
        });

        renderStocks(stocks, productsMap); // Renderiza a tabela de estoques
    } catch (error) {
        console.error('Erro ao carregar estoques:', error.message);
    }
}

// Renderiza os estoques na tabela
function renderStocks(stocks, productsMap) {
    stockTableBody.innerHTML = ''; // Limpa a tabela

    stocks.forEach(stock => {
        const row = document.createElement('tr');
        const productName = productsMap.get(stock.produto_id) || 'Produto não encontrado';

        row.innerHTML = `
            <td>${productName}</td>
            <td>${stock.numero_nota_fiscal}</td>
            <td>${new Date(stock.data_entrada).toLocaleString('pt-BR')}</td>
            <td>${stock.quantidade}</td>
            <td>
                <button class="edit" onclick="editStock(${JSON.stringify(stock).replace(/"/g, '&quot;')})">Editar</button>
                <button class="delete" onclick="deleteStock(${stock.id})">Excluir</button>
            </td>
        `;
        stockTableBody.appendChild(row);
    });
}

// Função para Limpar o Formulário
function clearFormStock() {
    productSelect.value = '';
    invoiceNumberInput.value = '';
    entryDateInput.value = '';
    quantityInput.value = '';
    editMode = false;
    editStockId = null;
    stockForm.querySelector('button').textContent = 'Cadastrar Estoque';
}

// Adiciona o listener para o envio do formulário
stockForm.addEventListener('submit', addStock);

// Carrega os produtos ao iniciar a página
loadStocks();
// Fim Estoque 

//Inicio Venda
// Elementos do DOM
const productSaleSelect = document.getElementById('productSaleSelect');
const quantitySaleInput = document.getElementById('quantitySale');
const addItemButton = document.getElementById('addItem');
const salesTableBody = document.getElementById('salesTableBody');
const subtotalSpan = document.getElementById('subtotal');
const finalizeSaleButton = document.getElementById('finalizeSale');

// Variáveis para armazenar os itens da venda
let saleItems = [];
let subtotal = 0;
let saleCode = null;

// Carrega os produtos para o dropdown
async function loadProductsSales() {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos`);
        if (!response.ok) throw new Error('Erro ao buscar produtos');
        const data = await response.json();
        const products = data.produtos || [];
        
        // Limpa as opções existentes no dropdown
        productSaleSelect.innerHTML = '';

        // Adiciona a opção inicial vazia
        const emptyOption = document.createElement('option');
        emptyOption.value = ''; // Valor vazio
        emptyOption.textContent = 'Selecione'; // Texto visível
        emptyOption.disabled = true; // Impede seleção
        emptyOption.selected = true; // Define como a opção padrão
        productSaleSelect.appendChild(emptyOption);        

        products.forEach(product => {
            const option = document.createElement('option');
            option.value = JSON.stringify(product); // Armazena o objeto produto
            option.textContent = `${product.nome} - R$ ${product.preco.toFixed(2)}`;
            productSaleSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error.message);
    }
}

// Adiciona um item à venda
function addItemToSale() {
    const productData = productSaleSelect.value;
    const quantity = parseInt(quantitySaleInput.value);

    if (!productData || isNaN(quantity) || quantity <= 0) {
        alert('Selecione um produto e insira uma quantidade válida.');
        return;
    }

    const product = JSON.parse(productData); // Recupera o objeto produto
    const total = product.preco * quantity;

    // Adiciona o item ao array de venda
    saleItems.push({
        produto_id: product.id,
        nome: product.nome,
        quantidade: quantity,
        preco_unitario: product.preco,
        total,
    });

    // Atualiza o subtotal
    subtotal += total;
    updateSubtotal();
    renderSaleItems();

    // Limpa os campos do formulário
    productSaleSelect.value = '';
    quantitySaleInput.value = '';
}

// Atualiza o subtotal exibido
function updateSubtotal() {
    subtotalSpan.textContent = subtotal.toFixed(2);
}

// Renderiza os itens da venda na tabela
function renderSaleItems() {
    salesTableBody.innerHTML = ''; // Limpa a tabela

    saleItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${item.preco_unitario.toFixed(2)}</td>
            <td>R$ ${item.total.toFixed(2)}</td>
            <td>
                <button class="delete" onclick="removeItemFromSale(${index})">Remover</button>
            </td>
        `;
        salesTableBody.appendChild(row);
    });
}

// Remove um item da venda
function removeItemFromSale(index) {
    subtotal -= saleItems[index].total; // Atualiza o subtotal
    saleItems.splice(index, 1); // Remove o item
    updateSubtotal();
    renderSaleItems();
}

// Finaliza a venda
async function finalizeSale() {
    if (saleItems.length === 0) {
        alert('Adicione pelo menos um item à venda.');
        return;
    }

    const saleCodeInput = document.getElementById('saleCode');
    const saleData = {
        codigo: saleCodeInput.value, // Código único da venda
        itens: saleItems.map(item => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco: item.preco_unitario, // Inclui o preço do produto
        })), // Mapeia os itens para o formato esperado
    };

    try {
        const response = await fetch(`${API_BASE_URL}/vendas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('Erro do servidor:', errorDetails);
            throw new Error(errorDetails.error || 'Erro ao finalizar venda');
        }

        alert('Venda finalizada com sucesso!');
        clearSale();
    } catch (error) {
        console.error('Erro ao finalizar venda:', error.message);
    }
}

function generateSaleCode() {
    if (!saleCode) {
        const now = new Date();
        const timestamp = now.getTime(); // Número de milissegundos desde 1970
        saleCode = `VENDA-${timestamp}`;
    }
    return saleCode;
}

// Limpa os dados da venda
function clearSale() {
    saleItems = [];
    subtotal = 0;
    saleCode = null; // Reseta o código da venda
    updateSubtotal();
    renderSaleItems();

    // Gera um novo código para a próxima venda
    const saleCodeInput = document.getElementById('saleCode');
    saleCodeInput.value = generateSaleCode();
}

// Event listeners
addItemButton.addEventListener('click', addItemToSale);
finalizeSaleButton.addEventListener('click', finalizeSale);

document.addEventListener('DOMContentLoaded', () => {
    const saleCodeInput = document.getElementById('saleCode');
    saleCodeInput.value = generateSaleCode(); // Gera o código da venda uma vez
});
//Fim Venda