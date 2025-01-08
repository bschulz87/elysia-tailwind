import Elysia from "elysia";
import postcss from "postcss";
import tw, { Config } from "tailwindcss";

type Options = {
	minify?: boolean;
	map?: boolean;
	autoprefixer?: boolean;
	import?: boolean;
	nesting?: boolean;
};

export const tailwind = (settings: {
	path: string;
	source: string;
	config: Config | string;
	options?: Options;
}) => {
	const {
		path,
		source,
		config,
		options: {
			minify = Bun.env.NODE_ENV === "production",
			map = Bun.env.NODE_ENV !== "production",
			autoprefixer = true,
			import: isEnablingImport = false,
			nesting: isEnablingNesting = false,
		} = {},
	} = settings;

	const result = Bun.file(source)
		.text()
		.then((sourceText) => {
			const plugins = [];

			if (isEnablingImport) {
				plugins.push(require("postcss-import")());
			}

			plugins.push(tw(config))

			if (autoprefixer) {
				plugins.push(require("autoprefixer")());
			}

			if (minify) {
				plugins.push(require("cssnano")());
			}

			if (isEnablingNesting) {
				plugins.push(require("postcss-nesting")());
			}

			return postcss(...plugins).process(sourceText, {
				from: source,
				map,
			});
		})
		.then(({ css }) => css);

	return new Elysia({ name: "tailwind", seed: settings }).get(
		path,
		async ({ set }) => {
			set.headers["content-type"] = "text/css";
			return result;
		},
	);
};
