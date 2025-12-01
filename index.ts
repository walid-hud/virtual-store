import { select, input, password } from "@inquirer/prompts";
import { log, warn } from "console";
const banner = 
`
██╗  ██╗    ███████╗████████╗ ██████╗ ██████╗ ███████╗
╚██╗██╔╝    ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
 ╚███╔╝     ███████╗   ██║   ██║   ██║██████╔╝█████╗  
 ██╔██╗     ╚════██║   ██║   ██║   ██║██╔══██╗██╔══╝  
██╔╝ ██╗    ███████║   ██║   ╚██████╔╝██║  ██║███████╗
╚═╝  ╚═╝    ╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
`;
type Product = {
	name: string;
	product_id: number;
	price: number;
	stock: number;
};
type Cart_item = {
	product_id: number;
	product_quantity: number;
};



let GLOBAL_PRODUCTS_COUNT = 1;
const products: Product[] = [];
const cart: Cart_item[] = [];

const example_products: Product[] = [
	{
		name: "Wireless Mouse",
		product_id: GLOBAL_PRODUCTS_COUNT++,
		price: 25,
		stock: 150,
	},
	{
		name: "Mechanical Keyboard",
		product_id: GLOBAL_PRODUCTS_COUNT++,
		price: 80,
		stock: 75,
	},
	{
		name: "HD Monitor",
		product_id: GLOBAL_PRODUCTS_COUNT++,
		price: 200,
		stock: 40,
	},
	{
		name: "USB-C Charger",
		product_id: GLOBAL_PRODUCTS_COUNT++,
		price: 30,
		stock: 300,
	},
	{
		name: "Noise Cancelling Headphones",
		product_id: GLOBAL_PRODUCTS_COUNT++,
		price: 120,
		stock: 60,
	},
];

products.push(...example_products);


async function user_section() {
	let return_to_main = false;
	const choices = [
		"list products",
		"add product to cart",
		"view cart",
		"remove product from cart",
		"check out",
		"log out",
	];
	while (!return_to_main) {
		const choice = await select({ message: "choose an option", choices,});
		switch (choice) {
			case choices[0]:
				list_products();
				break;
			case choices[1]:
				await add_product_to_cart();
				break;
			case choices[2]:
				view_cart();
				break;
			case choices[3]:
				await remove_product_from_cart();
				break;

			case choices[4]:
				await checkout();
				break;
			case choices[5]:
				return_to_main = true;
				break;
		}
	}
	return;
}
function list_products() {
	products.length === 0
		? log("no products available currently !")
		: products.map(print_product_details);
}
function print_product_details(product: Product) {
	log(
		`-----------------------------------------------------------
${product.name}
price: ${product.price}
ID: ${product.product_id}
${product.stock > 0 ? "stock :" + product.stock : "out of stock"}`
	);
}

async function add_product_to_cart() {
	log("type x to cancel");
	let chosen_product_id: string | number = await input({
		message: "enter product id : ",
		required: true,
		validate: validate_product_id,
	});
	if (chosen_product_id === "x") {
		return;
	}
	chosen_product_id = Number(chosen_product_id);

	let product_quantity = Number(
		await input({
			message: "enter quantity :",
			required: true,
			validate: (value) => {
				let quantity = Number(value);
				if (isNaN(quantity) || quantity < 0)
					return "invalid quantity! ";
				let product = products.find(
					(product) => product.product_id === chosen_product_id
				);
				if (!product) return "product unavailable!";
				if (product.stock - quantity < 0)
					return `product "${product.name}" has only ${product.stock} units left !`;
				product.stock -= quantity;
				return true;
			},
		})
	);

	const already_existing_item = cart.find(
		(item) => item.product_id === chosen_product_id
	);
	if (already_existing_item) {
		already_existing_item.product_quantity += product_quantity;
	} else {
		cart.push({ product_id: chosen_product_id, product_quantity });
	}

	log("product added to cart successfully!");
	return;
}

function validate_product_id(value: string): boolean | string {
	if (value === "x") return true; // for exiting
	let id = Number(value);
	if (isNaN(id) || id < 0 || id > products.length)
		return "no product with this id exist!";
	if (products.find((prod) => prod.product_id === id)?.stock === 0)
		return "this item is out of stock";
	return true;
}

function view_cart() {
	if (!cart.length) {
		log("\n cart empty ! try adding a product first.\n");
		return;
	}
	log("cart :");
	const { checkout_products, totale_price } = get_checkout_details();
	checkout_products.map((product) => {
		print_product_details(product);
		log(`quantity : ${product.quantity}`);
	});
	log("\n total (+ VAT ) : " + totale_price + "\n");
}

function get_checkout_details() {
	let totale_price = 0;
	const checkout_products: (Product & { quantity: number })[] = [];
	cart.map((cart_item) => {
		const product = products.find(
			(product) => product.product_id === cart_item.product_id
		);
		if (product) {
			checkout_products.push({
				...product,
				quantity: cart_item.product_quantity,
			});
			totale_price += Math.floor(
				product.price * cart_item.product_quantity * 1.2
			);
		} else {
			log("some products were not found");
		}
	});
	return { totale_price, checkout_products };
}

async function remove_product_from_cart() {
	log("type x to cancel");
	let chosen_product_id: string | number = await input({
		message: "enter product id : ",
		required: true,
		validate: (value) => {
			if (value === "x") return true;
			let id = Number(value);
			if (isNaN(id) || id < 0 || id > products.length)
				return "no product with this id exist!";
			return true;
		},
	});
	if (chosen_product_id === "x") {
		return;
	}
	chosen_product_id = Number(chosen_product_id);
	let product_to_remove = cart.find(
		(item) => item.product_id === chosen_product_id
	);
	if (product_to_remove) {
		cart.splice(cart.indexOf(product_to_remove), 1);
		log(`\nproduct removed successfully\n`);
		return;
	} else {
		log("\nthis product hasn't been add to cart yet\n");
		return;
	}
}
async function checkout() {
	const { checkout_products, totale_price } = get_checkout_details();
	log(
		`
cart items(${checkout_products.length})\t total(including VAT) : ${totale_price}
`
	);
	const answer = await select({
		message: "check out ? ",
		choices: ["yes", "continue shopping"],
	});
	if (answer === "yes") {
		checkout_products.map(print_product_details);
		log("\norder placed successfully !\n");
		cart.splice(0);
		return;
	} else {
		return;
	}
}


async function Main() {
	log(banner)
	await user_section()
}

await Main();
