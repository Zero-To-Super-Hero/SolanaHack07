"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Transaction } from "@solana/web3.js"
// import { PlusIcon, TrashIcon } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SelectTrigger, SelectValue } from "@/components/ui/select"
import { Networks } from "@/shared/types"
import { mintNFT, upload, uploadMetadata } from "../../shared/shyft"
import ConnectWalletButton from "@/components/wallet/connect-wallet-button"
import { NetworkSelect } from "@/components/wallet/network-select"
import { AspectRatio } from "@/components/ui/aspect-ratio"
// import { useToast } from "@/components/ui/toaster"
import { Uploader } from "@/components/ui/uploader"
// import { AspectRatio } from "@radix-ui/react-aspect-ratio"
import { Textarea } from "../ui/textarea"
import { useToast } from "../ui/use-toast"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import { useEffect, useState } from "react"

require('dotenv').config()

const formSchema = z.object({
    image: z.any().refine((file) => !!file, "Image is required."),
    name: z
        .string({ required_error: "This field is required." })
        .trim()
        .min(1, "This field is required.")
        .max(32, `The maximum allowed length for this field is 32 characters`),
    symbol: z
        .string({ required_error: "This field is required." })
        .trim()
        .min(1, "This field is required.")
        .max(10, `The maximum allowed length for this field is 10 characters`),
    description: z
        .string({ required_error: "This field is required." })
        .trim()
        .min(1, "This field is required.")
        .max(1000, `The maximum allowed length for this field is 1000 characters`),
    externalUrl: z.string().trim().max(256, `The maximum allowed length for this field is 256 characters`).optional(),
    collectionAddress: z.string().trim().optional(),
    attributes: z
        .array(
            z.object({
                trait_type: z
                    .string({ required_error: "This field is required." })
                    .trim()
                    .min(1, "This field is required.")
                    .max(10, `The maximum allowed length for this field is 10 characters`),
                value: z
                    .string({ required_error: "This field is required." })
                    .trim()
                    .min(1, "This field is required.")
                    .max(32, `The maximum allowed length for this field is 32 characters`),
            })
        )
        .optional(),
    merkle_tree: z.string({
        invalid_type_error: "This field is required.",
        required_error: "This field is required.",
    }),
    receiver: z.string().optional(),
    network: z.enum(Networks),
})

export const CreateEventForm = () => {
    const { toast } = useToast()
    const { connected, publicKey, sendTransaction } = useWallet()
    const { connection } = useConnection()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            symbol: "",
            description: "",
            externalUrl: "",
            collectionAddress: "",
            merkle_tree: process.env.SHYFT_TREE!,
            receiver: "",
            network: "devnet",
        },
    })

    const [defaultField, setDefaultField] = useState({ trait_type: "", value: "" })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "attributes",

    })
    useEffect(() => {
        append({ trait_type: "Location", value: "" });
        append({ trait_type: "Time", value: "" });
    }, [append]);

    const handleAppendField = () => {
        append(defaultField)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            console.log(values)

            if (!publicKey) {
                toast({
                    variant: "destructive",
                    title: "Please connect to your wallet",
                })
                return
            }

            const uploadResponse = await upload(values.image)

            if (!uploadResponse.success) {
                toast({
                    variant: "destructive",
                    title: "Upload error",
                    description: uploadResponse.message ?? "Unknown error",
                })
                return
            }

            const uploadMetadataResponse = await uploadMetadata({
                name: values.name,
                symbol: values.symbol,
                description: values.description ?? "",
                image: uploadResponse.result.uri,
                external_url: values.externalUrl ?? "",
                attributes: values.attributes ?? [],
                files: [
                    {
                        uri: uploadResponse.result.uri,
                        type: "image/png",
                    },
                ],
                royalty: 500, // 5%
                share: 100,
                creator: publicKey.toBase58(),
            })

            if (!uploadMetadataResponse.success) {
                toast({
                    variant: "destructive",
                    title: "Upload error",
                    description: uploadMetadataResponse.message ?? "Unknown error",
                })
                return
            }

            const response = await mintNFT({
                creator_wallet: publicKey.toBase58(),
                metadata_uri: uploadMetadataResponse.result.uri,
                merkle_tree: values.merkle_tree,
                collection_address: values.collectionAddress,
                receiver: values.receiver,
                fee_payer: publicKey.toBase58(),
                network: values.network,
            })

            if (response.success) {
                const tx = Transaction.from(Buffer.from(response.result.encoded_transaction, "base64"))
                const signature = await sendTransaction(tx, connection)
                await connection.confirmTransaction(signature, "confirmed")

                toast({
                    variant: "default",
                    title: "Your NFT minted successfully",
                    description: (
                        <a
                            className="underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://translator.shyft.to/tx/${signature}?cluster=${values.network}`}
                        >
                            View transaction
                        </a>
                    ),
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Error :(",
                    description: response.message ?? "Unknown error",
                })
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error :(",
                description: error?.message ?? "Unknown error",
            })
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="rounded-2xl shadow-cardflex flex-col gap-5 p-5 mb-5">
                        {/* image */}
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem className="w-full max-w-[240px]">
                                    <FormLabel>Image</FormLabel>
                                    <AspectRatio ratio={1 / 1}>
                                        <Uploader
                                            {...field}
                                            className="h-full"
                                            maxFiles={1}
                                            accept={{
                                                "image/png": [".png"],
                                                "image/jpeg": [".jpg", ".jpeg"],
                                            }}
                                            onExceedFileSize={() => form.setError("image", { message: "Max file size is 5MB" })}
                                            value={field.value ? [field.value] : []}
                                            onChange={(files) => {
                                                field.onChange(files?.[0])
                                            }}
                                        />
                                    </AspectRatio>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="NFT name"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* symbol */}
                        <FormField
                            control={form.control}
                            name="symbol"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Symbol</FormLabel>
                                    <FormControl>
                                        <Input placeholder="NFT symbol"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea rows={6} placeholder="NFT description"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* external url */}
                        <FormField
                            control={form.control}
                            name="externalUrl"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>External URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="External URL (optional)"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        URI pointing to an external URL defining the asset — e.g. the game&apos;s main site.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />

                        {/* collection address */}
                        {/* <FormField
                            control={form.control}
                            name="collectionAddress"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Collection address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Collection address (optional)"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                        On-chain address of the collection represented by an NFT, with max_supply of 0.
                                    </FormDescription>
                                </FormItem>
                            )}
                        /> */}

                        {/* attributes */}

                        {fields.map((field, index) => (
                            <div className="flex w-full items-center gap-6" key={field.id}>
                                <FormField
                                    control={form.control}
                                    name={`attributes.${index}.trait_type`}
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Trait type</FormLabel>
                                            <FormControl>
                                                <Input className="w-full" placeholder="Trait type" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name={`attributes.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Value</FormLabel>
                                            <FormControl>
                                                <Input className="w-full" placeholder="Trait value" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        event.preventDefault()
                                        remove(index)
                                    }}
                                    className="shrink-0 self-end"
                                >
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </div>
                        ))}

                        <Button
                            onClick={(event) => {
                                event.stopPropagation()
                                event.preventDefault()
                                handleAppendField()
                            }}
                            size="sm"
                            className="self-start mt-4"
                        >
                            <p>
                                <span><FontAwesomeIcon icon={faPlus} size="lg" /></span> Add attributes
                            </p>
                        </Button>

                        {/* merkle tree */}
                        {/* <FormField
                            control={form.control}
                            name="merkle_tree"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Merkle tree</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Merkle tree address"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}

                        {/* receiver */}
                        {/* <FormField
                            control={form.control}
                            name="receiver"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Receiver</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Receiver wallet (optional)"  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>Account address which will receive the newly created NFT.</FormDescription>
                                </FormItem>
                            )}
                        /> */}

                        {/* <FormField
                            control={form.control}
                            name="network"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Network</FormLabel>
                                    <FormControl>
                                        <NetworkSelect onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select network" />
                                                </SelectTrigger>
                                            </FormControl>
                                        </NetworkSelect>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}

                    </div>
                    <div className="flex justify-end">
                        {form.formState.isSubmitting ? "loading..." : ""}
                        {connected ? (
                            <Button type="submit">
                                Create
                            </Button>
                        ) : (
                            <ConnectWalletButton>Connect Wallet</ConnectWalletButton>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    )
}
