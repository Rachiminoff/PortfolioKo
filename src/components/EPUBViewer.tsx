// EPUBViewer.tsx

import React, {
    useEffect,
    useRef,
    useState
} from "react";

import "../assets/styles/EPUBViewer.scss";


interface EPUBViewerProps {
    url: string | null;
    onClose: () => void;
}


// Cache already opened EPUB files
const epubCache = new Map<string, ArrayBuffer>();


function EPUBViewer({
    url,
    onClose
}: EPUBViewerProps) {


    const viewerRef =
        useRef<HTMLDivElement | null>(null);


    const bookRef =
        useRef<any>(null);


    const renditionRef =
        useRef<any>(null);



    const [loading,setLoading] =
        useState(true);


    const [error,setError] =
        useState<string | null>(null);


    const [title,setTitle] =
        useState("EPUB Viewer");


    const [loadingTime,setLoadingTime] =
        useState(0);


    const [loadingStage,setLoadingStage] =
        useState(
            "Preparing EPUB..."
        );




    useEffect(()=>{

        if(!url)
            return;


        const previousOverflow =
            document.body.style.overflow;


        document.body.style.overflow =
            "hidden";



        const handleEscape =
            (e:KeyboardEvent)=>{

                if(e.key === "Escape"){
                    onClose();
                }

            };



        window.addEventListener(
            "keydown",
            handleEscape
        );



        return ()=>{

            window.removeEventListener(
                "keydown",
                handleEscape
            );


            document.body.style.overflow =
                previousOverflow || "auto";

        };


    },[url,onClose]);





    useEffect(()=>{


        if(
            !url ||
            !viewerRef.current
        )
            return;



        let cancelled = false;



        const cleanup = ()=>{


            try {

                renditionRef.current?.destroy();

            } catch {}


            try {

                bookRef.current?.destroy();

            } catch {}



            renditionRef.current = null;

            bookRef.current = null;

        };






        const loadEPUB = async()=>{


            const start =
                Date.now();



            const timer =
                setInterval(()=>{


                    setLoadingTime(
                        Math.floor(
                            (
                                Date.now()
                                -
                                start
                            )
                            /
                            1000
                        )
                    );


                },500);




            try {


                setLoading(true);

                setError(null);



                /*
                    Lazy load epub.js.
                    This keeps your main website fast.
                */
                setLoadingStage(
                    "Loading reader..."
                );


                const epubModule =
                    await import(
                        "epubjs"
                    );


                const ePub =
                    epubModule.default ||
                    epubModule;



                if(cancelled)
                    return;





                let buffer =
                    epubCache.get(url);




                if(!buffer){


                    setLoadingStage(
                        "Downloading EPUB..."
                    );



                    const response =
                        await fetch(url);



                    if(!response.ok)
                        throw new Error(
                            "Unable to download EPUB"
                        );



                    buffer =
                        await response.arrayBuffer();



                    epubCache.set(
                        url,
                        buffer
                    );

                }



                if(cancelled)
                    return;



                setLoadingStage(
                    "Opening book..."
                );



                const book =
                    ePub(buffer);



                bookRef.current =
                    book;




                try {


                    const metadata =
                        await book.loaded.metadata;



                    if(metadata.title){

                        setTitle(
                            metadata.title
                        );

                    }


                } catch {

                    console.log(
                        "No metadata found"
                    );

                }




                setLoadingStage(
                    "Rendering page..."
                );



                const rendition =
                    book.renderTo(
                        viewerRef.current!,
                        {
                            width:"100%",
                            height:"100%",
                            spread:"none",
                            flow:"paginated"
                        }
                    );



                renditionRef.current =
                    rendition;



                await rendition.display();



                if(cancelled)
                    return;



                setLoading(false);



            }
            catch(err){


                console.error(
                    "EPUB Error:",
                    err
                );



                if(!cancelled){

                    setError(
                        "Failed to load EPUB. The file may be unsupported."
                    );

                    setLoading(false);

                }

            }
            finally {


                clearInterval(
                    timer
                );


            }

        };




        loadEPUB();




        return ()=>{


            cancelled = true;

            cleanup();


        };



    },[url]);







    if(!url)
        return null;






    return (

        <div
            className="epub-viewer"
            onClick={onClose}
        >


            <div
                className="epub-window"
                onClick={
                    e=>e.stopPropagation()
                }
            >



                <div className="epub-window-topbar">



                    <div className="window-left">


                        <div className="window-controls">

                            <span className="red"/>
                            <span className="yellow"/>
                            <span className="green"/>

                        </div>



                        <div className="window-title">

                            📖 {title}

                        </div>


                    </div>





                    <div className="window-actions">


                        <button
                            className="window-btn"
                            onClick={()=>
                                window.open(
                                    url,
                                    "_blank"
                                )
                            }
                        >
                            Download EPUB
                        </button>




                        <button
                            className="window-close"
                            aria-label="Close EPUB viewer"
                            onClick={onClose}
                        >
                            ×
                        </button>


                    </div>



                </div>







                <div className="epub-frame-wrapper">


                    <div
                        ref={viewerRef}
                        className="epub-rendition"
                    />





                    {
                        loading &&
                        <div className="viewer-loading">


                            <div className="loading-spinner"/>



                            <span>

                                {loadingStage}

                                <br/>


                                <small>

                                    {loadingTime}s elapsed

                                </small>


                            </span>


                        </div>
                    }





                    {
                        error &&

                        <div className="viewer-error">


                            <span className="error-icon">
                                ⚠️
                            </span>


                            <p>
                                {error}
                            </p>



                            <button
                                className="window-btn"
                                onClick={()=>
                                    window.open(
                                        url,
                                        "_blank"
                                    )
                                }
                            >
                                Download EPUB
                            </button>


                        </div>

                    }



                </div>


            </div>


        </div>

    );

}


export default EPUBViewer;